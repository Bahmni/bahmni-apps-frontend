import { Condition, Bundle } from 'fhir/r4';
import { get } from '../../api';
import { CERTAINITY_CONCEPTS } from '../constants';
import { getPatientDiagnoses } from '../diagnosesService';

jest.mock('../../api');

describe('diagnosesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('getPatientDiagnoses', () => {
    const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

    const createMockDiagnosis = (
      overrides: Partial<Condition> = {},
    ): Condition => ({
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
            system:
              'http://terminology.hl7.org/CodeSystem/condition-ver-status',
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

    const createMockBundle = (conditions: Condition[] = []): Bundle => ({
      resourceType: 'Bundle',
      id: 'bundle-id',
      type: 'searchset',
      total: conditions.length,
      entry: conditions.map((condition) => ({
        resource: condition,
        fullUrl: `http://example.com/Condition/${condition.id}`,
      })),
    });

    describe('Happy Path Cases', () => {
      it('should return array of diagnoses', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            code: { text: 'Diabetes' },
            recordedDate: '2025-03-25T06:48:32+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            code: { text: 'Hypertension' },
            recordedDate: '2025-03-24T14:30:15+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`,
        );
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('diagnosis-1');
        expect(result[0].display).toBe('Diabetes');
        expect(result[1].id).toBe('diagnosis-2');
        expect(result[1].display).toBe('Hypertension');
      });

      it('should handle empty bundle gracefully', async () => {
        const emptyBundle = createMockBundle([]);
        (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toEqual([]);
      });

      it('should validate diagnosis data properly', async () => {
        const validCondition = createMockDiagnosis({
          id: 'valid-diagnosis',
          code: { text: 'Valid Diagnosis' },
          recordedDate: '2025-03-25T06:48:32+00:00',
        });
        const mockBundle = createMockBundle([validCondition]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('valid-diagnosis');
        expect(result[0].display).toBe('Valid Diagnosis');
      });

      it('should map certainty correctly', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'confirmed-diagnosis',
            code: { text: 'Confirmed Condition' },
            verificationStatus: {
              coding: [
                { code: 'confirmed', display: 'Confirmed', system: 'test' },
              ],
            },
          }),
          createMockDiagnosis({
            id: 'provisional-diagnosis',
            code: { text: 'Provisional Condition' },
            verificationStatus: {
              coding: [
                { code: 'provisional', display: 'Provisional', system: 'test' },
              ],
            },
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(2);
        const confirmedResult = result.find(
          (d) => d.display === 'Confirmed Condition',
        );
        const provisionalResult = result.find(
          (d) => d.display === 'Provisional Condition',
        );

        expect(confirmedResult?.certainty).toEqual(CERTAINITY_CONCEPTS[0]); // confirmed
        expect(provisionalResult?.certainty).toEqual(CERTAINITY_CONCEPTS[1]); // provisional
      });

      it('should handle malformed FHIR data', async () => {
        const invalidCondition = createMockDiagnosis({ id: undefined });
        const mockBundle = createMockBundle([invalidCondition]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        await expect(getPatientDiagnoses(patientUUID)).rejects.toThrow(
          'Incomplete diagnosis data',
        );
      });

      it('should handle missing code.text (uses empty string)', async () => {
        const mockConditions = [
          createMockDiagnosis({
            code: {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '44054006',
                  display: 'Diabetes mellitus type 2',
                },
              ],
            },
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result[0].display).toBe('');
      });

      it('should handle missing recorder (uses empty string)', async () => {
        const mockConditions = [createMockDiagnosis({ recorder: undefined })];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result[0].recorder).toBe('');
      });

      it('should handle unknown verification status (defaults to provisional)', async () => {
        const mockConditions = [
          createMockDiagnosis({
            verificationStatus: {
              coding: [{ code: 'unknown', display: 'Unknown', system: 'test' }],
            },
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // defaults to provisional
      });

      it('should handle missing verificationStatus (defaults to provisional)', async () => {
        const mockConditions = [
          createMockDiagnosis({
            verificationStatus: undefined,
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // defaults to provisional
      });

      it('should filter out non-Condition resources from bundle', async () => {
        const bundle: Bundle = {
          resourceType: 'Bundle',
          id: 'bundle-id',
          type: 'searchset',
          total: 2,
          entry: [
            {
              resource: createMockDiagnosis({ id: 'diagnosis-1' }),
              fullUrl: 'http://example.com/Condition/diagnosis-1',
            },
            {
              resource: {
                resourceType: 'Patient',
                id: 'patient-1',
              } as any,
              fullUrl: 'http://example.com/Patient/patient-1',
            },
          ],
        };

        (get as jest.Mock).mockResolvedValueOnce(bundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('diagnosis-1');
      });

      it('should return empty array when bundle has no entries', async () => {
        const bundleWithoutEntries: Bundle = {
          resourceType: 'Bundle',
          id: 'bundle-id',
          type: 'searchset',
          total: 0,
        };
        (get as jest.Mock).mockResolvedValueOnce(bundleWithoutEntries);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toEqual([]);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when API call fails', async () => {
        const apiError = new Error('API Error');
        (get as jest.Mock).mockRejectedValueOnce(apiError);

        await expect(getPatientDiagnoses(patientUUID)).rejects.toThrow(
          'API Error',
        );
      });

      it('should throw error when diagnosis has missing id', async () => {
        const invalidCondition = createMockDiagnosis({ id: undefined });
        const mockBundle = createMockBundle([invalidCondition]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        await expect(getPatientDiagnoses(patientUUID)).rejects.toThrow(
          'Incomplete diagnosis data',
        );
      });

      it('should throw error when diagnosis has empty id', async () => {
        const invalidCondition = createMockDiagnosis({ id: '' });
        const mockBundle = createMockBundle([invalidCondition]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        await expect(getPatientDiagnoses(patientUUID)).rejects.toThrow(
          'Incomplete diagnosis data',
        );
      });

      it('should throw error when diagnosis has missing code', async () => {
        const invalidCondition = createMockDiagnosis({ code: undefined });
        const mockBundle = createMockBundle([invalidCondition]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        await expect(getPatientDiagnoses(patientUUID)).rejects.toThrow(
          'Incomplete diagnosis data',
        );
      });

      it('should throw error when diagnosis has missing recordedDate', async () => {
        const invalidCondition = createMockDiagnosis({
          recordedDate: undefined,
        });
        const mockBundle = createMockBundle([invalidCondition]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        await expect(getPatientDiagnoses(patientUUID)).rejects.toThrow(
          'Incomplete diagnosis data',
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty patient UUID', async () => {
        const emptyUUID = '';
        const emptyBundle = createMockBundle([]);
        (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

        const result = await getPatientDiagnoses(emptyUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${emptyUUID}&_count=100&_sort=-_lastUpdated`,
        );
        expect(result).toEqual([]);
      });

      it('should handle special characters in patient UUID', async () => {
        const specialUUID = 'patient-uuid-with-special-chars-@#$%';
        const emptyBundle = createMockBundle([]);
        (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

        const result = await getPatientDiagnoses(specialUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${specialUUID}&_count=100&_sort=-_lastUpdated`,
        );
        expect(result).toEqual([]);
      });

      it('should handle bundle with empty entry array', async () => {
        const bundleWithEmptyEntries: Bundle = {
          resourceType: 'Bundle',
          id: 'bundle-id',
          type: 'searchset',
          total: 0,
          entry: [],
        };
        (get as jest.Mock).mockResolvedValueOnce(bundleWithEmptyEntries);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toEqual([]);
      });

      it('should handle multiple diagnoses with different statuses', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'confirmed-diagnosis',
            code: { text: 'Confirmed Diagnosis' },
            verificationStatus: {
              coding: [
                { code: 'confirmed', display: 'Confirmed', system: 'test' },
              ],
            },
          }),
          createMockDiagnosis({
            id: 'provisional-diagnosis',
            code: { text: 'Provisional Diagnosis' },
            verificationStatus: {
              coding: [
                { code: 'provisional', display: 'Provisional', system: 'test' },
              ],
            },
          }),
          createMockDiagnosis({
            id: 'unknown-diagnosis',
            code: { text: 'Unknown Diagnosis' },
            verificationStatus: undefined,
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(3);
        expect(result[0].certainty).toEqual(CERTAINITY_CONCEPTS[0]); // confirmed
        expect(result[1].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // provisional
        expect(result[2].certainty).toEqual(CERTAINITY_CONCEPTS[1]); // defaults to provisional
      });
    });

    describe('Deduplication', () => {
      it('should deduplicate diagnoses with same display name', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            code: { text: 'Wasting syndrome' },
            recordedDate: '2024-01-13T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            code: { text: 'Wasting syndrome' },
            recordedDate: '2024-01-13T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-3',
            code: { text: 'Wasting syndrome' },
            recordedDate: '2024-01-13T10:00:00+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].display).toBe('Wasting syndrome');
      });

      it('should keep most recent diagnosis by recordedDate', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'old-diagnosis',
            code: { text: 'Diabetes' },
            recordedDate: '2024-01-10T10:00:00+00:00',
            recorder: { display: 'Dr. Smith' },
          }),
          createMockDiagnosis({
            id: 'new-diagnosis',
            code: { text: 'Diabetes' },
            recordedDate: '2024-01-15T10:00:00+00:00',
            recorder: { display: 'Dr. Johnson' },
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('new-diagnosis');
        expect(result[0].recorder).toBe('Dr. Johnson');
        expect(result[0].recordedDate).toBe('2024-01-15T10:00:00+00:00');
      });

      it('should use id as tiebreaker when recordedDate is same', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-a',
            code: { text: 'Hypertension' },
            recordedDate: '2024-01-13T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-z',
            code: { text: 'Hypertension' },
            recordedDate: '2024-01-13T10:00:00+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('diagnosis-z'); // Higher alphabetically
      });

      it('should be case-insensitive when deduplicating', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            code: { text: 'diabetes' },
            recordedDate: '2024-01-10T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            code: { text: 'Diabetes' },
            recordedDate: '2024-01-15T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-3',
            code: { text: 'DIABETES' },
            recordedDate: '2024-01-12T10:00:00+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('diagnosis-2'); // Most recent
        expect(result[0].display).toBe('Diabetes'); // Preserves original casing
      });

      it('should trim whitespace when deduplicating', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            code: { text: 'Asthma' },
            recordedDate: '2024-01-10T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            code: { text: '  Asthma  ' },
            recordedDate: '2024-01-15T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-3',
            code: { text: ' Asthma' },
            recordedDate: '2024-01-12T10:00:00+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('diagnosis-2'); // Most recent
      });

      it('should keep different diagnoses when names are different', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            code: { text: 'Diabetes' },
            recordedDate: '2024-01-13T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            code: { text: 'Hypertension' },
            recordedDate: '2024-01-13T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-3',
            code: { text: 'Asthma' },
            recordedDate: '2024-01-13T10:00:00+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(3);
        expect(result.map((d) => d.display).sort()).toEqual([
          'Asthma',
          'Diabetes',
          'Hypertension',
        ]);
      });

      it('should handle empty array deduplication', async () => {
        const emptyBundle = createMockBundle([]);
        (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toEqual([]);
      });

      it('should handle single diagnosis (no duplicates)', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'single-diagnosis',
            code: { text: 'Single Diagnosis' },
            recordedDate: '2024-01-13T10:00:00+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('single-diagnosis');
      });

      it('should deduplicate mixed scenario with some duplicates', async () => {
        const mockConditions = [
          // Duplicate group 1: Diabetes (3 entries)
          createMockDiagnosis({
            id: 'diabetes-1',
            code: { text: 'Diabetes' },
            recordedDate: '2024-01-10T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'diabetes-2',
            code: { text: 'Diabetes' },
            recordedDate: '2024-01-15T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'diabetes-3',
            code: { text: 'Diabetes' },
            recordedDate: '2024-01-12T10:00:00+00:00',
          }),
          // Unique diagnosis
          createMockDiagnosis({
            id: 'unique-1',
            code: { text: 'Asthma' },
            recordedDate: '2024-01-13T10:00:00+00:00',
          }),
          // Duplicate group 2: Hypertension (2 entries)
          createMockDiagnosis({
            id: 'hypertension-1',
            code: { text: 'Hypertension' },
            recordedDate: '2024-01-11T10:00:00+00:00',
          }),
          createMockDiagnosis({
            id: 'hypertension-2',
            code: { text: 'Hypertension' },
            recordedDate: '2024-01-14T10:00:00+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnoses(patientUUID);

        expect(result).toHaveLength(3);
        const resultMap = new Map(result.map((d) => [d.display, d]));

        expect(resultMap.get('Diabetes')?.id).toBe('diabetes-2'); // Most recent
        expect(resultMap.get('Asthma')?.id).toBe('unique-1'); // Only one
        expect(resultMap.get('Hypertension')?.id).toBe('hypertension-2'); // Most recent
      });
    });
  });
});
