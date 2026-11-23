import { Bundle, Task } from 'fhir/r4';
import { get, post } from '../../api';
import { searchConceptByName } from '../../conceptService';
import { FHIR_EXPORT_TASKS_URL } from '../constants';
import { getFhirExportTasks, submitFhirExport } from '../fhirExportService';

jest.mock('../../api');
jest.mock('../../conceptService');

const mockGet = get as jest.MockedFunction<typeof get>;
const mockPost = post as jest.MockedFunction<typeof post>;
const mockSearchConceptByName = searchConceptByName as jest.MockedFunction<
  typeof searchConceptByName
>;

const input = (text: string, valueString: string) => ({
  type: { text },
  valueString,
});

const buildTask = (overrides: Partial<Task> = {}): Task => ({
  resourceType: 'Task',
  id: 'task-1',
  status: 'completed',
  intent: 'order',
  authoredOn: '2024-05-01T10:00:00.000+00:00',
  basedOn: [{ reference: 'anonymise-uuid' }],
  input: [
    input('FHIR Export User Name', 'superman'),
    input('FHIR Export Start Date', '2024-04-01'),
    input('FHIR Export End Date', '2024-04-30'),
    input('FHIR Export Anonymise Flag', 'True'),
  ],
  output: [
    {
      type: { text: 'url' },
      valueString: 'http://files/export.zip',
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
  });

  describe('submitFhirExport', () => {
    it('posts the export request with anonymise and date range params', async () => {
      mockPost.mockResolvedValueOnce({});

      await submitFhirExport({
        startDate: '2024-04-01',
        endDate: '2024-04-30',
        anonymise: true,
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/fhirexport?anonymise=true&startDate=2024-04-01&endDate=2024-04-30',
        {},
      );
    });

    it('sends anonymise=false for a non anonymised export', async () => {
      mockPost.mockResolvedValueOnce({});

      await submitFhirExport({
        startDate: '2024-04-01',
        endDate: '2024-04-30',
        anonymise: false,
      });

      expect(mockPost.mock.calls[0][0]).toContain('anonymise=false');
    });

    it('propagates request failures', async () => {
      mockPost.mockRejectedValueOnce(new Error('boom'));

      await expect(
        submitFhirExport({
          startDate: '2024-04-01',
          endDate: '2024-04-30',
          anonymise: true,
        }),
      ).rejects.toThrow('boom');
    });
  });

  describe('getFhirExportTasks', () => {
    beforeEach(() => {
      mockSearchConceptByName.mockResolvedValue({
        uuid: 'anonymise-uuid',
      } as never);
    });

    it('requests the latest 50 tasks and maps export inputs', async () => {
      mockGet.mockResolvedValueOnce(bundleOf(buildTask()));

      const tasks = await getFhirExportTasks();

      expect(mockGet).toHaveBeenCalledWith(FHIR_EXPORT_TASKS_URL);
      expect(tasks).toEqual([
        {
          id: 'task-1',
          userName: 'superman',
          triggeredDate: '2024-05-01T10:00:00.000+00:00',
          startDate: '2024-04-01',
          endDate: '2024-04-30',
          anonymised: true,
          status: 'completed',
          downloadUrl: 'http://files/export.zip',
          statusReason: undefined,
        },
      ]);
    });

    it('keeps only tasks based on the anonymise flag concept', async () => {
      mockGet.mockResolvedValueOnce(
        bundleOf(
          buildTask({ id: 'export' }),
          buildTask({
            id: 'other',
            basedOn: [{ reference: 'something-else' }],
          }),
          buildTask({ id: 'no-based-on', basedOn: undefined }),
        ),
      );

      const tasks = await getFhirExportTasks();

      expect(tasks.map((task) => task.id)).toEqual(['export']);
    });

    it('only exposes the download link for completed tasks', async () => {
      mockGet.mockResolvedValueOnce(
        bundleOf(buildTask({ status: 'accepted' })),
      );

      const [task] = await getFhirExportTasks();

      expect(task.downloadUrl).toBeUndefined();
    });

    it('surfaces the failure reason of a failed task', async () => {
      mockGet.mockResolvedValueOnce(
        bundleOf(
          buildTask({
            status: 'failed',
            output: undefined,
            statusReason: { text: 'Out of memory' },
          }),
        ),
      );

      const [task] = await getFhirExportTasks();

      expect(task.status).toBe('failed');
      expect(task.statusReason).toBe('Out of memory');
    });

    it('returns an empty list when the anonymise flag concept is missing', async () => {
      mockSearchConceptByName.mockResolvedValue(null);
      mockGet.mockResolvedValueOnce(bundleOf(buildTask()));

      expect(await getFhirExportTasks()).toEqual([]);
    });

    it('follows continuation links until export tasks are found', async () => {
      mockGet
        .mockResolvedValueOnce({
          ...bundleOf(
            buildTask({ id: 'other', basedOn: [{ reference: 'something' }] }),
          ),
          link: [
            {
              relation: 'next',
              url: 'http://host/openmrs/ws/fhir2/R4?_getpages=abc&_getpagesoffset=50',
            },
          ],
        })
        .mockResolvedValueOnce(bundleOf(buildTask({ id: 'export' })));

      const tasks = await getFhirExportTasks();

      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenLastCalledWith(
        '/openmrs/ws/fhir2/R4?_getpages=abc&_getpagesoffset=50',
      );
      expect(tasks.map((task) => task.id)).toEqual(['export']);
    });

    it('does not request another page when no continuation link exists', async () => {
      mockGet.mockResolvedValueOnce(bundleOf(buildTask()));

      await getFhirExportTasks();

      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('stops following links once the page cap is reached', async () => {
      const pageWithNext = {
        ...bundleOf(
          buildTask({ id: 'other', basedOn: [{ reference: 'something' }] }),
        ),
        link: [{ relation: 'next', url: '/openmrs/ws/fhir2/R4?page=n' }],
      };
      mockGet.mockResolvedValue(pageWithNext);

      expect(await getFhirExportTasks()).toEqual([]);
      expect(mockGet).toHaveBeenCalledTimes(10);
    });

    it('returns an empty list when the bundle has no entries', async () => {
      mockGet.mockResolvedValueOnce({
        resourceType: 'Bundle',
        type: 'searchset',
      });

      expect(await getFhirExportTasks()).toEqual([]);
    });
  });
});
