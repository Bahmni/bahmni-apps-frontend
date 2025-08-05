import {
  mockCondition,
  mockConditionBundle,
  mockEmptyConditionBundle,
  mockMalformedBundle,
  mockConditionWithoutOptionalFields,
  mockApiErrors,
} from '../__mocks__/mocks';
import { ConditionStatus } from '../models';
import { get } from '../../api';
import {
  formatConditions,
  getConditions,
  getPatientConditionsBundle,
} from '../conditionService';

jest.mock('../../api');

describe('conditionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('getPatientConditionsBundle', () => {
    it('should fetch condition bundle for a valid patient UUID', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      (get as jest.Mock).mockResolvedValueOnce(mockConditionBundle);

      const result = await getPatientConditionsBundle(patientUUID);

      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Condition?category=problem-list-item&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`,
      );
      expect(result).toEqual(mockConditionBundle);
    });

    it('should propagate errors from the API', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      const error = new Error('Network error');
      (get as jest.Mock).mockRejectedValueOnce(error);

      await expect(getPatientConditionsBundle(patientUUID)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getConditions', () => {
    describe('Successful Responses', () => {
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
    });

    describe('API Error Handling', () => {
      it('should propagate network errors', async () => {
        const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
        const error = new Error('Network error');
        (get as jest.Mock).mockRejectedValueOnce(error);

        await expect(getConditions(patientUUID)).rejects.toThrow(
          'Network error',
        );
      });

      it('should propagate 404 not found error', async () => {
        const patientUUID = 'non-existent';
        const error = new Error(mockApiErrors.notFound.message);
        error.name = 'NotFoundError';
        (get as jest.Mock).mockRejectedValueOnce(error);

        await expect(getConditions(patientUUID)).rejects.toThrow(
          'Patient not found',
        );
      });

      it('should propagate 401 unauthorized error', async () => {
        const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
        const error = new Error(mockApiErrors.unauthorized.message);
        error.name = 'UnauthorizedError';
        (get as jest.Mock).mockRejectedValueOnce(error);

        await expect(getConditions(patientUUID)).rejects.toThrow(
          'Unauthorized access',
        );
      });

      it('should propagate 500 server error', async () => {
        const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
        const error = new Error(mockApiErrors.serverError.message);
        error.name = 'ServerError';
        (get as jest.Mock).mockRejectedValueOnce(error);

        await expect(getConditions(patientUUID)).rejects.toThrow(
          'Internal server error',
        );
      });
    });

    describe('Malformed Response Handling', () => {
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

  describe('formatConditions', () => {
    describe('Successful Formatting', () => {
      it('should correctly format an array of conditions', () => {
        const result = formatConditions([mockCondition]);

        expect(result).toEqual([
          {
            id: mockCondition.id,
            display: mockCondition.code!.text,
            status: ConditionStatus.Active,
            onsetDate: mockCondition.onsetDateTime,
            recordedDate: mockCondition.recordedDate,
            recorder: mockCondition.recorder?.display,
            code: mockCondition.code.coding[0].code,
            codeDisplay: mockCondition.code.coding[0].display,
            note: undefined,
          },
        ]);
      });

      it('should correctly format a condition with inactive status', () => {
        const inactiveCondition = {
          ...mockCondition,
          clinicalStatus: {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'inactive',
                display: 'Inactive',
              },
            ],
          },
        };

        const result = formatConditions([inactiveCondition]);
        expect(result[0].status).toBe(ConditionStatus.Inactive);
      });

      it('should correctly format a condition with notes', () => {
        const conditionWithNotes = {
          ...mockCondition,
          note: [
            {
              text: 'Test note 1',
              authorString: 'Dr. Test',
              time: '2025-03-25T06:48:32+00:00',
            },
            {
              text: 'Test note 2',
              authorString: 'Dr. Test',
              time: '2025-03-25T06:48:32+00:00',
            },
          ],
        };

        const result = formatConditions([conditionWithNotes]);
        expect(result[0].note).toEqual(['Test note 1', 'Test note 2']);
      });

      it('should format multiple conditions correctly', () => {
        const conditions = [
          mockCondition,
          {
            ...mockCondition,
            id: 'second-condition',
            code: {
              ...mockCondition.code,
              text: 'Second Condition',
            },
          },
        ];

        const result = formatConditions(conditions);
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(mockCondition.id);
        expect(result[1].id).toBe('second-condition');
        expect(result[1].display).toBe('Second Condition');
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should return empty array for empty input', () => {
        const result = formatConditions([]);
        expect(result).toEqual([]);
      });

      it('should throw error for condition without required fields', () => {
        expect(() =>
          formatConditions([mockConditionWithoutOptionalFields]),
        ).toThrow('Incomplete condition data');
      });

      it('should throw error for malformed condition data', () => {
        const malformedCondition = {
          id: 'malformed',
          // Missing required code property
          /* eslint-disable  @typescript-eslint/no-explicit-any */
        } as any;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        expect(() => formatConditions([malformedCondition])).toThrow(
          'Incomplete condition data',
        );
      });
    });
  });
});
