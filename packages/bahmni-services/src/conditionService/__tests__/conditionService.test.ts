import { get } from '../../api';
import {
  mockCondition,
  mockConditionBundle,
  mockEmptyConditionBundle,
  mockMalformedBundle,
} from '../__mocks__/mocks';
import {
  getConditions,
  getConditionsBundle,
  getConditionPage,
} from '../conditionService';

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

  describe('getConditionPage', () => {
    const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

    it('should fetch page 1 with default count', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockConditionBundle);

      const result = await getConditionPage(patientUUID);

      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Condition?category=problem-list-item&patient=${patientUUID}&_count=10&_getpagesoffset=0&_sort=-_lastUpdated`,
      );
      expect(result.conditions).toEqual([mockCondition]);
      expect(result.total).toBe(1);
    });

    it('should calculate correct offset for page 2', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockConditionBundle);

      await getConditionPage(patientUUID, 5, 2);

      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Condition?category=problem-list-item&patient=${patientUUID}&_count=5&_getpagesoffset=5&_sort=-_lastUpdated`,
      );
    });

    it('should calculate correct offset for page 3 with count 10', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockConditionBundle);

      await getConditionPage(patientUUID, 10, 3);

      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Condition?category=problem-list-item&patient=${patientUUID}&_count=10&_getpagesoffset=20&_sort=-_lastUpdated`,
      );
    });

    it('should return total from bundle', async () => {
      const bundleWithTotal = { ...mockConditionBundle, total: 42 };
      (get as jest.Mock).mockResolvedValueOnce(bundleWithTotal);

      const result = await getConditionPage(patientUUID, 10, 1);

      expect(result.total).toBe(42);
    });

    it('should return undefined total when bundle total is missing', async () => {
      const bundleWithoutTotal = { ...mockConditionBundle, total: undefined };
      (get as jest.Mock).mockResolvedValueOnce(bundleWithoutTotal);

      const result = await getConditionPage(patientUUID, 10, 1);

      expect(result.total).toBeUndefined();
    });

    it('should return empty conditions for empty bundle', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockEmptyConditionBundle);

      const result = await getConditionPage(patientUUID, 10, 1);

      expect(result.conditions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should propagate errors from the API', async () => {
      const error = new Error('Network error');
      (get as jest.Mock).mockRejectedValueOnce(error);

      await expect(getConditionPage(patientUUID)).rejects.toThrow(
        'Network error',
      );
    });
  });
});
