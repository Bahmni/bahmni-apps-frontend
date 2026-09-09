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

  describe('getTasks', () => {
    const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';

    it('should fetch tasks with required parameters', async () => {
      mockedGet.mockResolvedValueOnce(mockTaskBundle);

      await getTasks(patientUuid);

      expect(mockedGet).toHaveBeenCalledWith(TASKS_URL(patientUuid));
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

    it('should handle empty string patientUuid', async () => {
      const emptyPatientUuid = '';
      mockedGet.mockResolvedValueOnce(emptyTaskBundle);

      await getTasks(emptyPatientUuid);

      expect(mockedGet).toHaveBeenCalledWith(TASKS_URL(emptyPatientUuid));
    });

    it('should propagate API errors when request fails', async () => {
      const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';
      const error = new Error('Network error');
      mockedGet.mockRejectedValueOnce(error);

      await expect(getTasks(patientUuid)).rejects.toThrow('Network error');
    });

    it('should propagate API errors with status codes', async () => {
      const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';
      const error = { status: 404, message: 'Patient not found' };
      mockedGet.mockRejectedValueOnce(error);

      await expect(getTasks(patientUuid)).rejects.toEqual(error);
    });
  });
});
