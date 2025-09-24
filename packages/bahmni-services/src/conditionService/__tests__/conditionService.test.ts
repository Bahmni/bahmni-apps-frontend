import { get } from '../../api';
import {
  mockCondition,
  mockConditionBundle,
  mockEmptyConditionBundle,
  mockMalformedBundle,
} from '../__mocks__/mocks';
import { getConditions, getConditionsBundle } from '../conditionService';

jest.mock('../../api');

describe('conditionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('getConditionsBundle', () => {
    it('should fetch condition bundle for a valid patient UUID', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      (get as jest.Mock).mockResolvedValueOnce(mockConditionBundle);

      const result = await getConditionsBundle(patientUUID);

      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Condition?category=problem-list-item&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`,
      );
      expect(result).toEqual(mockConditionBundle);
    });

    it('should propagate errors from the API', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      const error = new Error('Network error');
      (get as jest.Mock).mockRejectedValueOnce(error);

      await expect(getConditionsBundle(patientUUID)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getConditions', () => {
    it('should fetch conditions for a valid patient UUID', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      (get as jest.Mock).mockResolvedValueOnce(mockConditionBundle);

      const result = await getConditions(patientUUID);

      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Condition?category=problem-list-item&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`,
      );
      expect(result).toEqual([mockCondition]);
    });

    it('should return empty array when no conditions exist', async () => {
      const patientUUID = 'no-conditions';
      (get as jest.Mock).mockResolvedValueOnce(mockEmptyConditionBundle);

      const result = await getConditions(patientUUID);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle missing entry array', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      const malformedResponse = { ...mockConditionBundle, entry: undefined };
      (get as jest.Mock).mockResolvedValueOnce(malformedResponse);

      const result = await getConditions(patientUUID);
      expect(result).toEqual([]);
    });

    it('should filter out invalid resource types', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      (get as jest.Mock).mockResolvedValueOnce(mockMalformedBundle);

      const result = await getConditions(patientUUID);
      expect(result).toEqual([]);
    });
  });
});
