import { getPatientDiagnosisBundle, formatDiagnoses } from '../diagnosesService';
import { get } from '../api';
import { formatDate } from '@/utils/date';
import { CERTAINITY_CONCEPTS } from '@/constants/concepts';
import { Condition } from 'fhir/r4';

jest.mock('../api');
jest.mock('@/utils/date');

describe('diagnosesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('getPatientDiagnosisBundle', () => {
    const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
    const expectedUrl = `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${patientUUID}`;

    const mockDiagnosisCondition: Condition = {
      resourceType: 'Condition',
      id: 'diagnosis-1',
      meta: {
        lastUpdated: '2025-03-25T06:48:32+00:00',
      },
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active',
            display: 'Active',
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
            display: 'Confirmed',
          },
        ],
      },
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-category',
              code: 'encounter-diagnosis',
              display: 'Encounter Diagnosis',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '44054006',
            display: 'Diabetes mellitus type 2',
          },
        ],
        text: 'Type 2 Diabetes Mellitus',
      },
      subject: {
        reference: `Patient/${patientUUID}`,
        display: 'John Doe',
      },
      onsetDateTime: '2025-01-15T00:00:00+00:00',
      recordedDate: '2025-03-25T06:48:32+00:00',
      recorder: {
        reference: 'Practitioner/practitioner-1',
        display: 'Dr. Smith',
      },
    };

    const mockDiagnosisBundle: Condition = {
      resourceType: 'Bundle',
      id: 'diagnosis-bundle-1',
      type: 'searchset',
      total: 1,
      entry: [
        {
          resource: mockDiagnosisCondition,
        },
      ],
    } as unknown as Condition;

    const mockEmptyDiagnosisBundle: Condition = {
      resourceType: 'Bundle',
      id: 'empty-diagnosis-bundle',
      type: 'searchset',
      total: 0,
      entry: [],
    } as unknown as Condition;

    describe('Successful Responses', () => {
      it('should fetch diagnosis bundle for a valid patient UUID', async () => {
        (get as jest.Mock).mockResolvedValueOnce(mockDiagnosisBundle);

        const result = await getPatientDiagnosisBundle(patientUUID);

        expect(get).toHaveBeenCalledWith(expectedUrl);
        expect(result).toEqual(mockDiagnosisBundle);
      });

      it('should return empty bundle when no diagnoses exist', async () => {
        (get as jest.Mock).mockResolvedValueOnce(mockEmptyDiagnosisBundle);

        const result = await getPatientDiagnosisBundle(patientUUID);

        expect(get).toHaveBeenCalledWith(expectedUrl);
        expect(result).toEqual(mockEmptyDiagnosisBundle);
      });

      it('should construct correct URL with patient UUID', async () => {
        const testPatientUUID = 'test-patient-uuid-123';
        const expectedTestUrl = `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${testPatientUUID}`;
        
        (get as jest.Mock).mockResolvedValueOnce(mockDiagnosisBundle);

        await getPatientDiagnosisBundle(testPatientUUID);

        expect(get).toHaveBeenCalledWith(expectedTestUrl);
      });
    });

    describe('API Error Handling', () => {
      it('should propagate network errors from the API', async () => {
        const networkError = new Error('Network connection failed');
        (get as jest.Mock).mockRejectedValueOnce(networkError);

        await expect(getPatientDiagnosisBundle(patientUUID)).rejects.toThrow(
          'Network connection failed',
        );

        expect(get).toHaveBeenCalledWith(expectedUrl);
      });

      it('should propagate 404 not found errors', async () => {
        const notFoundError = new Error('Patient not found');
        notFoundError.name = 'NotFoundError';
        (get as jest.Mock).mockRejectedValueOnce(notFoundError);

        await expect(getPatientDiagnosisBundle(patientUUID)).rejects.toThrow(
          'Patient not found',
        );
      });

      it('should propagate 401 unauthorized errors', async () => {
        const unauthorizedError = new Error('Unauthorized access');
        unauthorizedError.name = 'UnauthorizedError';
        (get as jest.Mock).mockRejectedValueOnce(unauthorizedError);

        await expect(getPatientDiagnosisBundle(patientUUID)).rejects.toThrow(
          'Unauthorized access',
        );
      });

      it('should propagate 500 server errors', async () => {
        const serverError = new Error('Internal server error');
        serverError.name = 'ServerError';
        (get as jest.Mock).mockRejectedValueOnce(serverError);

        await expect(getPatientDiagnosisBundle(patientUUID)).rejects.toThrow(
          'Internal server error',
        );
      });

      it('should propagate generic API errors', async () => {
        const genericError = new Error('Something went wrong');
        (get as jest.Mock).mockRejectedValueOnce(genericError);

        await expect(getPatientDiagnosisBundle(patientUUID)).rejects.toThrow(
          'Something went wrong',
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty patient UUID', async () => {
        const emptyUUID = '';
        const expectedEmptyUrl = `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${emptyUUID}`;
        
        (get as jest.Mock).mockResolvedValueOnce(mockEmptyDiagnosisBundle);

        const result = await getPatientDiagnosisBundle(emptyUUID);

        expect(get).toHaveBeenCalledWith(expectedEmptyUrl);
        expect(result).toEqual(mockEmptyDiagnosisBundle);
      });

      it('should handle special characters in patient UUID', async () => {
        const specialUUID = 'patient-uuid-with-special-chars-@#$%';
        const expectedSpecialUrl = `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${specialUUID}`;
        
        (get as jest.Mock).mockResolvedValueOnce(mockDiagnosisBundle);

        await getPatientDiagnosisBundle(specialUUID);

        expect(get).toHaveBeenCalledWith(expectedSpecialUrl);
      });

      it('should handle null response from API', async () => {
        (get as jest.Mock).mockResolvedValueOnce(null);

        const result = await getPatientDiagnosisBundle(patientUUID);

        expect(result).toBeNull();
      });

      it('should handle undefined response from API', async () => {
        (get as jest.Mock).mockResolvedValueOnce(undefined);

        const result = await getPatientDiagnosisBundle(patientUUID);

        expect(result).toBeUndefined();
      });
    });

    describe('Response Validation', () => {
      it('should return response as-is without modification', async () => {
        const customResponse = {
          resourceType: 'Bundle',
          id: 'custom-bundle',
          customField: 'custom-value',
        } as unknown as Condition;

        (get as jest.Mock).mockResolvedValueOnce(customResponse);

        const result = await getPatientDiagnosisBundle(patientUUID);

        expect(result).toEqual(customResponse);
        expect(result).toBe(customResponse); // Should be the exact same object
      });

      it('should handle malformed bundle structure', async () => {
        const malformedBundle = {
          resourceType: 'InvalidType',
          someField: 'someValue',
        } as unknown as Condition;

        (get as jest.Mock).mockResolvedValueOnce(malformedBundle);

        const result = await getPatientDiagnosisBundle(patientUUID);

        expect(result).toEqual(malformedBundle);
      });
    });
  });

  describe('formatDiagnoses', () => {
    const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;

    const createMockDiagnosis = (overrides: Partial<Condition> = {}): Condition => ({
      resourceType: 'Condition',
      id: 'diagnosis-1',
      subject: {
        reference: 'Patient/test-patient',
        display: 'Test Patient',
      },
      code: {
        text: 'Type 2 Diabetes Mellitus',
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '44054006',
            display: 'Diabetes mellitus type 2',
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
            display: 'Confirmed',
          },
        ],
      },
      recordedDate: '2025-03-25T06:48:32+00:00',
      recorder: {
        reference: 'Practitioner/practitioner-1',
        display: 'Dr. Smith',
      },
      ...overrides,
    });

    beforeEach(() => {
      mockFormatDate.mockReturnValue({
        formattedResult: '25/03/2025',
      });
    });

    describe('Happy Path Cases', () => {
      it('should format a single diagnosis with confirmed certainty', () => {
        const mockDiagnosis = createMockDiagnosis();
        
        const result = formatDiagnoses([mockDiagnosis]);

        expect(result).toEqual([
          {
            id: 'diagnosis-1',
            display: 'Type 2 Diabetes Mellitus',
            certainty: CERTAINITY_CONCEPTS[0], // confirmed
            recordedDate: '2025-03-25T06:48:32+00:00',
            formattedDate: '25/03/2025',
            recorder: 'Dr. Smith',
          },
        ]);
        expect(mockFormatDate).toHaveBeenCalledWith('2025-03-25T06:48:32+00:00');
      });

      it('should format a single diagnosis with provisional certainty', () => {
        const mockDiagnosis = createMockDiagnosis({
          verificationStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                code: 'Provisional',
                display: 'Provisional',
              },
            ],
          },
        });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // provisional
      });

      it('should format multiple diagnoses correctly', () => {
        const mockDiagnoses = [
          createMockDiagnosis({ id: 'diagnosis-1' }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            code: { text: 'Hypertension' },
            verificationStatus: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                  code: 'Provisional',
                  display: 'Provisional',
                },
              ],
            },
          }),
        ];

        const result = formatDiagnoses(mockDiagnoses);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('diagnosis-1');
        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[0]);
        expect(result[1].id).toBe('diagnosis-2');
        expect(result[1].display).toBe('Hypertension');
        expect(result[1].certainty).toEqual(CERTAINITY_CONCEPTS[1]);
      });

      it('should handle diagnosis with unknown verification status (defaults to provisional)', () => {
        const mockDiagnosis = createMockDiagnosis({
          verificationStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                code: 'unknown-status',
                display: 'Unknown',
              },
            ],
          },
        });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // defaults to provisional
      });
    });

    describe('Sad Path Cases', () => {
      it('should throw error when formatDate returns an error', () => {
        const mockDiagnosis = createMockDiagnosis();
        mockFormatDate.mockReturnValue({
          formattedResult: '',
          error: {
            title: 'Date Error',
            message: 'Invalid date format',
          },
        });

        expect(() => formatDiagnoses([mockDiagnosis])).toThrow('Error fetching patient diagnoses');
      });

      it('should handle diagnosis with undefined id (returns undefined in result)', () => {
        const mockDiagnosis = createMockDiagnosis({ id: undefined });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].id).toBeUndefined();
        expect(result[0].display).toBe('Type 2 Diabetes Mellitus');
      });

      it('should handle diagnosis with undefined code.text (uses empty string)', () => {
        const mockDiagnosis = createMockDiagnosis({
          code: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '44054006',
                display: 'Diabetes mellitus type 2',
              },
            ],
          },
        });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].display).toBe('');
      });

      it('should handle diagnosis with undefined recordedDate', () => {
        const mockDiagnosis = createMockDiagnosis({ recordedDate: undefined });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].recordedDate).toBeUndefined();
        expect(mockFormatDate).toHaveBeenCalledWith(undefined);
      });

      it('should handle diagnosis with undefined recorder.display (uses empty string)', () => {
        const mockDiagnosis = createMockDiagnosis({
          recorder: {
            reference: 'Practitioner/practitioner-1',
          },
        });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].recorder).toBe('');
      });

      it('should handle diagnosis with undefined recorder (uses empty string)', () => {
        const mockDiagnosis = createMockDiagnosis({ recorder: undefined });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].recorder).toBe('');
      });
    });

    describe('Edge Cases', () => {
      it('should return empty array for empty input', () => {
        const result = formatDiagnoses([]);

        expect(result).toEqual([]);
        expect(mockFormatDate).not.toHaveBeenCalled();
      });

      it('should handle diagnosis with missing verificationStatus', () => {
        const mockDiagnosis = createMockDiagnosis({
          verificationStatus: undefined,
        });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // defaults to provisional
      });

      it('should handle diagnosis with missing verificationStatus.coding', () => {
        const mockDiagnosis = createMockDiagnosis({
          verificationStatus: {
            coding: undefined,
          },
        });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // defaults to provisional
      });

      it('should handle diagnosis with empty verificationStatus.coding array', () => {
        const mockDiagnosis = createMockDiagnosis({
          verificationStatus: {
            coding: [],
          },
        });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // defaults to provisional
      });

      it('should handle diagnosis with null verificationStatus.coding[0].code', () => {
        const mockDiagnosis = createMockDiagnosis({
          verificationStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code: null as any,
                display: 'Unknown',
              },
            ],
          },
        });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // defaults to provisional
      });
    });

    describe('mapDiagnosisCertainty Internal Function Tests', () => {
      it('should map "confirmed" status to CERTAINITY_CONCEPTS[0]', () => {
        const mockDiagnosis = createMockDiagnosis({
          verificationStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                code: 'confirmed',
                display: 'Confirmed',
              },
            ],
          },
        });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[0]);
        expect(result[0].certainty.code).toBe('confirmed');
        expect(result[0].certainty.display).toBe('CERTAINITY_CONFIRMED');
      });

      it('should map "Provisional" status to CERTAINITY_CONCEPTS[1]', () => {
        const mockDiagnosis = createMockDiagnosis({
          verificationStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                code: 'Provisional',
                display: 'Provisional',
              },
            ],
          },
        });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[1]);
        expect(result[0].certainty.code).toBe('provisional');
        expect(result[0].certainty.display).toBe('CERTAINITY_PROVISIONAL');
      });

      it('should default to CERTAINITY_CONCEPTS[1] for any other status', () => {
        const testCases = ['unconfirmed', 'entered-in-error', 'refuted', 'unknown'];

        testCases.forEach((statusCode) => {
          const mockDiagnosis = createMockDiagnosis({
            verificationStatus: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                  code: statusCode,
                  display: statusCode,
                },
              ],
            },
          });

          const result = formatDiagnoses([mockDiagnosis]);

          expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[1]);
        });
      });

      it('should default to CERTAINITY_CONCEPTS[1] when verificationStatus is completely missing', () => {
        const mockDiagnosis = createMockDiagnosis({
          verificationStatus: undefined,
        });

        const result = formatDiagnoses([mockDiagnosis]);

        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[1]);
      });
    });

    describe('Integration Tests', () => {
      it('should handle complex scenario with mixed verification statuses', () => {
        const mockDiagnoses = [
          createMockDiagnosis({
            id: 'confirmed-diagnosis',
            code: { text: 'Confirmed Diabetes' },
            verificationStatus: {
              coding: [{ code: 'confirmed', display: 'Confirmed', system: 'test' }],
            },
          }),
          createMockDiagnosis({
            id: 'provisional-diagnosis',
            code: { text: 'Provisional Hypertension' },
            verificationStatus: {
              coding: [{ code: 'Provisional', display: 'Provisional', system: 'test' }],
            },
          }),
          createMockDiagnosis({
            id: 'unknown-diagnosis',
            code: { text: 'Unknown Condition' },
            verificationStatus: {
              coding: [{ code: 'unknown', display: 'Unknown', system: 'test' }],
            },
          }),
        ];

        const result = formatDiagnoses(mockDiagnoses);

        expect(result).toHaveLength(3);
        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[0]); // confirmed
        expect(result[1].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // provisional
        expect(result[2].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // defaults to provisional
      });

      it('should call formatDate for each diagnosis', () => {
        const mockDiagnoses = [
          createMockDiagnosis({ recordedDate: '2025-01-01T00:00:00Z' }),
          createMockDiagnosis({ recordedDate: '2025-02-01T00:00:00Z' }),
        ];

        formatDiagnoses(mockDiagnoses);

        expect(mockFormatDate).toHaveBeenCalledTimes(2);
        expect(mockFormatDate).toHaveBeenNthCalledWith(1, '2025-01-01T00:00:00Z');
        expect(mockFormatDate).toHaveBeenNthCalledWith(2, '2025-02-01T00:00:00Z');
      });
    });
  });
});
