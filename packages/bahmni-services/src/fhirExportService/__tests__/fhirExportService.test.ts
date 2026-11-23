import { Bundle, Task } from 'fhir/r4';
import * as api from '../../api';
import { searchConceptByName } from '../../conceptService';
import { FHIR_EXPORT_URL } from '../constants';
import {
  buildFhirExportTasksUrl,
  buildFhirExportUrl,
  fetchFhirExportTasks,
  isFhirExportTaskTerminal,
  submitFhirExport,
} from '../fhirExportService';
import { FhirExportTask } from '../models';

jest.mock('../../api');
jest.mock('../../conceptService');

const ANONYMISE_CONCEPT_UUID = '8741c3e7-a250-4808-977c-a89459bb6c9d';

const exportTask = (overrides: Partial<Task> = {}): Task => ({
  resourceType: 'Task',
  id: 'task-1',
  status: 'completed',
  intent: 'order',
  authoredOn: '2024-05-02T10:00:00+00:00',
  input: [
    {
      type: { text: 'FHIR Export User Name' },
      valueString: 'superman',
    },
    {
      type: { text: 'FHIR Export Start Date' },
      valueString: '2024-05-01',
    },
    {
      type: { text: 'FHIR Export End Date' },
      valueString: '2024-05-31',
    },
    {
      type: { text: 'FHIR Export Anonymise Flag' },
      valueString: 'true',
    },
  ],
  output: [
    {
      type: { text: 'Download URL' },
      valueString: 'http://host/export?file=task-1',
    },
  ],
  ...overrides,
});

const bundleOf = (...tasks: Task[]): Bundle<Task> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: tasks.map((resource) => ({ resource })),
});

describe('fhirExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (searchConceptByName as jest.Mock).mockResolvedValue({
      uuid: ANONYMISE_CONCEPT_UUID,
    });
  });

  describe('buildFhirExportUrl', () => {
    it('includes the date range and anonymise flag', () => {
      expect(
        buildFhirExportUrl({
          startDate: '2024-05-01',
          endDate: '2024-05-31',
          anonymise: true,
        }),
      ).toBe(
        `${FHIR_EXPORT_URL}?startDate=2024-05-01&endDate=2024-05-31&anonymise=true`,
      );
    });

    it('omits dates that are not provided', () => {
      expect(buildFhirExportUrl({ anonymise: false })).toBe(
        `${FHIR_EXPORT_URL}?anonymise=false`,
      );
    });
  });

  describe('submitFhirExport', () => {
    it('POSTs to the export endpoint and returns the task reference', async () => {
      const response = { status: 'ACCEPTED', taskId: 'abc', link: '/Task/abc' };
      (api.post as jest.Mock).mockResolvedValue(response);

      const result = await submitFhirExport({
        startDate: '2024-05-01',
        endDate: '2024-05-31',
        anonymise: false,
      });

      expect(api.post).toHaveBeenCalledWith(
        `${FHIR_EXPORT_URL}?startDate=2024-05-01&endDate=2024-05-31&anonymise=false`,
        null,
      );
      expect(result).toBe(response);
    });

    it('propagates API errors', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Forbidden'));

      await expect(submitFhirExport({ anonymise: true })).rejects.toThrow(
        'Forbidden',
      );
    });
  });

  describe('fetchFhirExportTasks', () => {
    it('asks the server only for tasks based on the anonymise-flag concept', async () => {
      (api.get as jest.Mock).mockResolvedValue(bundleOf());

      await fetchFhirExportTasks();

      expect(searchConceptByName).toHaveBeenCalledWith(
        'FHIR Export Anonymise Flag',
        'custom:(uuid)',
      );
      expect(api.get).toHaveBeenCalledWith(
        buildFhirExportTasksUrl(ANONYMISE_CONCEPT_UUID),
      );
      expect(buildFhirExportTasksUrl(ANONYMISE_CONCEPT_UUID)).toBe(
        `/openmrs/ws/fhir2/R4/Task?based-on=ServiceRequest/${ANONYMISE_CONCEPT_UUID}&_sort:desc=_lastUpdated&_count=50`,
      );
    });

    it('returns no tasks, without querying them, when the anonymise-flag concept does not exist', async () => {
      (searchConceptByName as jest.Mock).mockResolvedValue(null);

      expect(await fetchFhirExportTasks()).toEqual([]);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('returns no tasks when the task request resolves to an empty response', async () => {
      (api.get as jest.Mock).mockResolvedValue(undefined);

      expect(await fetchFhirExportTasks()).toEqual([]);
    });

    it('propagates failures of the task request', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Boom'));

      await expect(fetchFhirExportTasks()).rejects.toThrow('Boom');
    });

    it('maps a completed export task to a row', async () => {
      (api.get as jest.Mock).mockResolvedValue(bundleOf(exportTask()));

      expect(await fetchFhirExportTasks()).toEqual([
        {
          id: 'task-1',
          status: 'completed',
          userName: 'superman',
          authoredOn: '2024-05-02T10:00:00+00:00',
          startDate: '2024-05-01',
          endDate: '2024-05-31',
          anonymised: true,
          downloadUrl: 'http://host/export?file=task-1',
          errorMessage: undefined,
        },
      ]);
    });

    it('prefers the output named Download URL over other outputs', async () => {
      (api.get as jest.Mock).mockResolvedValue(
        bundleOf(
          exportTask({
            output: [
              { type: { text: 'Other' }, valueString: 'http://host/other' },
              {
                type: { text: 'Download URL' },
                valueString: 'http://host/export?file=task-1',
              },
            ],
          }),
        ),
      );

      const [task] = await fetchFhirExportTasks();

      expect(task.downloadUrl).toBe('http://host/export?file=task-1');
    });

    it('only exposes the download link for completed tasks', async () => {
      (api.get as jest.Mock).mockResolvedValue(
        bundleOf(exportTask({ status: 'accepted' })),
      );

      const [task] = await fetchFhirExportTasks();

      expect(task.downloadUrl).toBeUndefined();
    });

    it('surfaces the server error message of a failed task', async () => {
      (api.get as jest.Mock).mockResolvedValue(
        bundleOf(
          exportTask({
            status: 'failed',
            statusReason: { text: 'Disk full' },
          }),
        ),
      );

      const [task] = await fetchFhirExportTasks();

      expect(task.status).toBe('failed');
      expect(task.errorMessage).toBe('Disk full');
    });

    it('reports anonymise as false when the flag is not true', async () => {
      (api.get as jest.Mock).mockResolvedValue(
        bundleOf(
          exportTask({
            input: [
              {
                type: { text: 'FHIR Export Anonymise Flag' },
                valueString: 'false',
              },
            ],
          }),
        ),
      );

      const [task] = await fetchFhirExportTasks();

      expect(task.anonymised).toBe(false);
    });

    it('ignores tasks that are not FHIR exports', async () => {
      (api.get as jest.Mock).mockResolvedValue(
        bundleOf(
          exportTask({ id: 'other', input: [] }),
          exportTask({ id: 'no-input', input: undefined }),
          exportTask({ id: 'export' }),
        ),
      );

      const tasks = await fetchFhirExportTasks();

      expect(tasks.map((task) => task.id)).toEqual(['export']);
    });

    it('returns an empty list when the bundle has no entries', async () => {
      (api.get as jest.Mock).mockResolvedValue({
        resourceType: 'Bundle',
        type: 'searchset',
      });

      expect(await fetchFhirExportTasks()).toEqual([]);
    });
  });

  describe('isFhirExportTaskTerminal', () => {
    const taskWith = (status: string): FhirExportTask => ({
      id: 'x',
      status,
      anonymised: true,
    });

    it.each(['completed', 'failed', 'rejected', 'cancelled'])(
      'treats %s as terminal',
      (status) => {
        expect(isFhirExportTaskTerminal(taskWith(status))).toBe(true);
      },
    );

    it.each(['requested', 'accepted', 'in-progress'])(
      'treats %s as non-terminal',
      (status) => {
        expect(isFhirExportTaskTerminal(taskWith(status))).toBe(false);
      },
    );
  });
});
