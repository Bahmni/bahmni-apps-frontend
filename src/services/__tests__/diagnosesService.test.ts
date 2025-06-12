import { getPatientDiagnosesByDate } from '../diagnosesService';
import { get } from '../api';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';
import { Condition, Bundle } from 'fhir/r4';

jest.mock('../api');

describe('diagnosesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('getPatientDiagnosesByDate', () => {
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
      it('should fetch, format, and group diagnoses by date', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            recordedDate: '2025-03-25T06:48:32+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            recordedDate: '2025-03-24T14:30:15+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`,
        );
        expect(result).toHaveLength(2);
        // Check that both dates are present but don't assume order
        const dates = result.map((group) => group.date);
        expect(dates).toContain('2025-03-25');
        expect(dates).toContain('2025-03-24');
        expect(
          result.find((group) => group.date === '2025-03-25')?.diagnoses,
        ).toHaveLength(1);
        expect(
          result.find((group) => group.date === '2025-03-24')?.diagnoses,
        ).toHaveLength(1);
      });

      it('should return empty array when no diagnoses exist', async () => {
        const emptyBundle = createMockBundle([]);
        (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toEqual([]);
      });

      it('should return empty array when bundle has no entries', async () => {
        const bundleWithoutEntries: Bundle = {
          resourceType: 'Bundle',
          id: 'bundle-id',
          type: 'searchset',
          total: 0,
        };
        (get as jest.Mock).mockResolvedValueOnce(bundleWithoutEntries);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toEqual([]);
      });

      it('should group multiple diagnoses from same date', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            code: { text: 'Diabetes' },
            recordedDate: '2025-03-25T06:48:32+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            code: { text: 'Hypertension' },
            recordedDate: '2025-03-25T14:30:15+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toHaveLength(1); // Same date means same group in new implementation
        expect(result[0].date).toBe('2025-03-25'); // Date only
        expect(result[0].diagnoses).toHaveLength(2);
        expect(result[0].diagnoses[0].display).toBe('Diabetes');
        expect(result[0].diagnoses[1].display).toBe('Hypertension');
      });

      it('should handle different verification statuses correctly', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            code: { text: 'Confirmed Diabetes' },
            verificationStatus: {
              coding: [
                { code: 'confirmed', display: 'Confirmed', system: 'test' },
              ],
            },
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            code: { text: 'Provisional Hypertension' },
            verificationStatus: {
              coding: [
                { code: 'provisional', display: 'Provisional', system: 'test' },
              ],
            },
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result[0].diagnoses[0].certainty).toEqual(
          CERTAINITY_CONCEPTS[0],
        ); // confirmed
        expect(result[0].diagnoses[1].certainty).toEqual(
          CERTAINITY_CONCEPTS[1],
        ); // provisional
      });

      it('should return diagnoses grouped by date', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            recordedDate: '2025-03-20T06:48:32+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            recordedDate: '2025-03-25T14:30:15+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-3',
            recordedDate: '2025-03-22T10:15:00+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toHaveLength(3);
        // Check that all dates are present but don't assume any specific order
        const dates = result.map((group) => group.date);
        expect(dates).toContain('2025-03-20');
        expect(dates).toContain('2025-03-25');
        expect(dates).toContain('2025-03-22');
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any,
              fullUrl: 'http://example.com/Patient/patient-1',
            },
          ],
        };

        (get as jest.Mock).mockResolvedValueOnce(bundle);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].diagnoses).toHaveLength(1);
        expect(result[0].diagnoses[0].id).toBe('diagnosis-1');
      });
    });

    describe('Error Handling', () => {
      it('should throw error when API call fails', async () => {
        const apiError = new Error('API Error');
        (get as jest.Mock).mockRejectedValueOnce(apiError);

        await expect(getPatientDiagnosesByDate(patientUUID)).rejects.toThrow(
          'API Error',
        );
      });

      it('should throw error when diagnosis has missing id', async () => {
        const invalidCondition = createMockDiagnosis({ id: undefined });
        const mockBundle = createMockBundle([invalidCondition]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        await expect(getPatientDiagnosesByDate(patientUUID)).rejects.toThrow(
          'Incomplete diagnosis data',
        );
      });

      it('should throw error when diagnosis has missing code', async () => {
        const invalidCondition = createMockDiagnosis({ code: undefined });
        const mockBundle = createMockBundle([invalidCondition]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        await expect(getPatientDiagnosesByDate(patientUUID)).rejects.toThrow(
          'Incomplete diagnosis data',
        );
      });

      it('should throw error when diagnosis has missing recordedDate', async () => {
        const invalidCondition = createMockDiagnosis({
          recordedDate: undefined,
        });
        const mockBundle = createMockBundle([invalidCondition]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        await expect(getPatientDiagnosesByDate(patientUUID)).rejects.toThrow(
          'Incomplete diagnosis data',
        );
      });

      it('should throw error when diagnosis validation fails', async () => {
        const invalidCondition = createMockDiagnosis({
          id: '', // Empty string should fail validation
        });
        const mockBundle = createMockBundle([invalidCondition]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        await expect(getPatientDiagnosesByDate(patientUUID)).rejects.toThrow(
          'Incomplete diagnosis data',
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty patient UUID', async () => {
        const emptyUUID = '';
        const emptyBundle = createMockBundle([]);
        (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

        const result = await getPatientDiagnosesByDate(emptyUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${emptyUUID}&_count=100&_sort=-_lastUpdated`,
        );
        expect(result).toEqual([]);
      });

      it('should handle special characters in patient UUID', async () => {
        const specialUUID = 'patient-uuid-with-special-chars-@#$%';
        const emptyBundle = createMockBundle([]);
        (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

        await getPatientDiagnosesByDate(specialUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${specialUUID}&_count=100&_sort=-_lastUpdated`,
        );
      });

      it('should handle diagnosis with missing code.text (uses empty string)', async () => {
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

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result[0].diagnoses[0].display).toBe('');
      });

      it('should handle diagnosis with missing recorder (uses empty string)', async () => {
        const mockConditions = [createMockDiagnosis({ recorder: undefined })];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result[0].diagnoses[0].recorder).toBe('');
      });

      it('should handle diagnosis with missing verificationStatus (defaults to provisional)', async () => {
        const mockConditions = [
          createMockDiagnosis({
            verificationStatus: undefined,
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result[0].diagnoses[0].certainty).toEqual(
          CERTAINITY_CONCEPTS[1],
        ); // defaults to provisional
      });

      it('should handle diagnoses with same date but different times', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            recordedDate: '2025-03-25T06:48:32+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            recordedDate: '2025-03-25T23:59:59+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnosesByDate(patientUUID);

        // In new implementation, same date means same group regardless of time
        expect(result).toHaveLength(1);
        expect(result[0].date).toBe('2025-03-25'); // Date only
        expect(result[0].diagnoses).toHaveLength(2);
      });

      it('should handle diagnoses across different years', async () => {
        const mockConditions = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            recordedDate: '2024-12-31T23:59:59+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            recordedDate: '2025-01-01T00:00:01+00:00',
          }),
        ];
        const mockBundle = createMockBundle(mockConditions);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toHaveLength(2);
        // Check that both dates are present but don't assume order
        const dates = result.map((group) => group.date);
        expect(dates).toContain('2025-01-01');
        expect(dates).toContain('2024-12-31');
      });
    });
  });
});
