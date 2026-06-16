import { get } from '../../api';
import { TASKS_URL } from '../constants';
import { getTasks } from '../taskService';
import { emptyTaskBundle, mockTaskBundle } from './__mocks__/taskServiceMocks';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;

describe('taskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TASKS_URL', () => {
    const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';

    it('should construct URL with required parameters only', () => {
      const url = TASKS_URL(patientUuid);

      expect(url).toBe(
        `/openmrs/ws/fhir2/R4/Tasks?patient=${patientUuid}&_sort=-_lastUpdated`,
      );
    });

    it('should construct URL with basedOnReference parameter', () => {
      const basedOnReference = 'ServiceRequest/service-123';
      const url = TASKS_URL(patientUuid, basedOnReference);

      expect(url).toBe(
        `/openmrs/ws/fhir2/R4/Tasks?patient=${patientUuid}&_sort=-_lastUpdated&based-on=${basedOnReference}`,
      );
    });

    it('should construct URL with encounterUuids parameter', () => {
      const encounterUuids = ['encounter-1', 'encounter-2'];
      const url = TASKS_URL(patientUuid, undefined, encounterUuids);

      expect(url).toBe(
        `/openmrs/ws/fhir2/R4/Tasks?patient=${patientUuid}&_sort=-_lastUpdated&encounter=encounter-1,encounter-2`,
      );
    });

    it('should construct URL with all parameters', () => {
      const basedOnReference = 'ServiceRequest/service-123';
      const encounterUuids = ['encounter-1', 'encounter-2'];
      const url = TASKS_URL(patientUuid, basedOnReference, encounterUuids);

      expect(url).toBe(
        `/openmrs/ws/fhir2/R4/Tasks?patient=${patientUuid}&_sort=-_lastUpdated&based-on=${basedOnReference}&encounter=encounter-1,encounter-2`,
      );
    });

    it('should not include encounter parameter when encounterUuids is empty array', () => {
      const url = TASKS_URL(patientUuid, undefined, []);

      expect(url).toBe(
        `/openmrs/ws/fhir2/R4/Tasks?patient=${patientUuid}&_sort=-_lastUpdated`,
      );
      expect(url).not.toContain('encounter=');
    });
  });

  describe('getTasks', () => {
    const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';

    it('should fetch tasks with required parameters', async () => {
      mockedGet.mockResolvedValueOnce(mockTaskBundle);

      await getTasks(patientUuid);

      expect(mockedGet).toHaveBeenCalledWith(TASKS_URL(patientUuid));
    });

    it('should return the task bundle', async () => {
      mockedGet.mockResolvedValueOnce(mockTaskBundle);

      const result = await getTasks(patientUuid);

      expect(result).toEqual(mockTaskBundle);
    });

    it('should fetch tasks with basedOnReference', async () => {
      const basedOnReference = 'ServiceRequest/service-123';
      mockedGet.mockResolvedValueOnce(mockTaskBundle);

      await getTasks(patientUuid, basedOnReference);

      expect(mockedGet).toHaveBeenCalledWith(
        TASKS_URL(patientUuid, basedOnReference),
      );
    });

    it('should fetch tasks with encounterUuids', async () => {
      const encounterUuids = ['encounter-1', 'encounter-2'];
      mockedGet.mockResolvedValueOnce(mockTaskBundle);

      await getTasks(patientUuid, undefined, encounterUuids);

      expect(mockedGet).toHaveBeenCalledWith(
        TASKS_URL(patientUuid, undefined, encounterUuids),
      );
    });

    it('should fetch tasks with empty encounterUuids array', async () => {
      const encounterUuids: string[] = [];
      mockedGet.mockResolvedValueOnce(mockTaskBundle);

      await getTasks(patientUuid, undefined, encounterUuids);

      expect(mockedGet).toHaveBeenCalledWith(
        TASKS_URL(patientUuid, undefined, encounterUuids),
      );
    });

    it('should fetch tasks with all optional parameters', async () => {
      const basedOnReference = 'ServiceRequest/service-123';
      const encounterUuids = ['encounter-1'];
      mockedGet.mockResolvedValueOnce(mockTaskBundle);

      await getTasks(patientUuid, basedOnReference, encounterUuids);

      expect(mockedGet).toHaveBeenCalledWith(
        TASKS_URL(patientUuid, basedOnReference, encounterUuids),
      );
    });

    it('should return bundle unchanged when entry is undefined', async () => {
      mockedGet.mockResolvedValueOnce(emptyTaskBundle);

      const result = await getTasks(patientUuid);

      expect(result).toEqual(emptyTaskBundle);
      expect(result.entry).toBeUndefined();
    });
  });
});
