import { getPatientDiagnosesByDate } from '../diagnosesService';
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

  describe('getPatientDiagnosesByDate', () => {
    const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;
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

    beforeEach(() => {
      mockFormatDate.mockReturnValue({
        formattedResult: '25/03/2025',
      });
    });

    describe('Happy Path Cases', () => {
      it('should fetch, format, and group diagnoses by date', async () => {
        const mockDiagnoses = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            recordedDate: '2025-03-25T06:48:32+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            recordedDate: '2025-03-24T14:30:15+00:00',
          }),
        ];

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);
        mockFormatDate
          .mockReturnValueOnce({ formattedResult: '25/03/2025' })
          .mockReturnValueOnce({ formattedResult: '24/03/2025' });

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${patientUUID}`,
        );
        expect(result).toHaveLength(2);
        expect(result[0].date).toBe('25/03/2025'); // Newer date first
        expect(result[0].diagnoses).toHaveLength(1);
        expect(result[1].date).toBe('24/03/2025');
        expect(result[1].diagnoses).toHaveLength(1);
      });

      it('should return empty array when no diagnoses exist', async () => {
        (get as jest.Mock).mockResolvedValueOnce([]);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toEqual([]);
      });

      it('should group multiple diagnoses from same date', async () => {
        const mockDiagnoses = [
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

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].date).toBe('25/03/2025');
        expect(result[0].diagnoses).toHaveLength(2);
        expect(result[0].diagnoses[0].display).toBe('Diabetes');
        expect(result[0].diagnoses[1].display).toBe('Hypertension');
      });

      it('should handle different verification statuses correctly', async () => {
        const mockDiagnoses = [
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
                { code: 'Provisional', display: 'Provisional', system: 'test' },
              ],
            },
          }),
        ];

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result[0].diagnoses[0].certainty).toEqual(
          CERTAINITY_CONCEPTS[0],
        ); // confirmed
        expect(result[0].diagnoses[1].certainty).toEqual(
          CERTAINITY_CONCEPTS[1],
        ); // provisional
      });

      it('should sort dates in descending order (newest first)', async () => {
        const mockDiagnoses = [
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

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);
        mockFormatDate
          .mockReturnValueOnce({ formattedResult: '20/03/2025' })
          .mockReturnValueOnce({ formattedResult: '25/03/2025' })
          .mockReturnValueOnce({ formattedResult: '22/03/2025' });

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('25/03/2025'); // Newest first
        expect(result[1].date).toBe('22/03/2025');
        expect(result[2].date).toBe('20/03/2025'); // Oldest last
      });
    });

    describe('Error Handling', () => {
      it('should throw error when API call fails', async () => {
        const apiError = new Error('API Error');
        (get as jest.Mock).mockRejectedValueOnce(apiError);

        await expect(getPatientDiagnosesByDate(patientUUID)).rejects.toThrow(
          'Error fetching patient diagnoses',
        );
      });

      it('should throw error when diagnosis has missing required fields', async () => {
        const mockDiagnoses = [
          createMockDiagnosis({ id: undefined }), // Missing required field
        ];

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);

        await expect(getPatientDiagnosesByDate(patientUUID)).rejects.toThrow(
          'Error fetching patient diagnoses',
        );
      });

      it('should throw error when formatDate fails', async () => {
        const mockDiagnoses = [createMockDiagnosis()];
        mockFormatDate.mockReturnValue({
          formattedResult: '',
          error: {
            title: 'Date Error',
            message: 'Invalid date format',
          },
        });

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);

        await expect(getPatientDiagnosesByDate(patientUUID)).rejects.toThrow(
          'Error fetching patient diagnoses',
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty patient UUID', async () => {
        const emptyUUID = '';
        (get as jest.Mock).mockResolvedValueOnce([]);

        const result = await getPatientDiagnosesByDate(emptyUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${emptyUUID}`,
        );
        expect(result).toEqual([]);
      });

      it('should handle special characters in patient UUID', async () => {
        const specialUUID = 'patient-uuid-with-special-chars-@#$%';
        (get as jest.Mock).mockResolvedValueOnce([]);

        await getPatientDiagnosesByDate(specialUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${specialUUID}`,
        );
      });

      it('should handle diagnosis with missing code.text (uses empty string)', async () => {
        const mockDiagnoses = [
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

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result[0].diagnoses[0].display).toBe('');
      });

      it('should handle diagnosis with missing recorder (uses empty string)', async () => {
        const mockDiagnoses = [createMockDiagnosis({ recorder: undefined })];

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result[0].diagnoses[0].recorder).toBe('');
      });

      it('should handle diagnosis with missing verificationStatus (defaults to provisional)', async () => {
        const mockDiagnoses = [
          createMockDiagnosis({
            verificationStatus: undefined,
          }),
        ];

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result[0].diagnoses[0].certainty).toEqual(
          CERTAINITY_CONCEPTS[1],
        ); // defaults to provisional
      });

      it('should handle diagnoses with same date but different times', async () => {
        const mockDiagnoses = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            recordedDate: '2025-03-25T06:48:32+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            recordedDate: '2025-03-25T23:59:59+00:00',
          }),
        ];

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].diagnoses).toHaveLength(2);
      });

      it('should handle diagnoses across different years', async () => {
        const mockDiagnoses = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            recordedDate: '2024-12-31T23:59:59+00:00',
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            recordedDate: '2025-01-01T00:00:01+00:00',
          }),
        ];

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);
        mockFormatDate
          .mockReturnValueOnce({ formattedResult: '31/12/2024' })
          .mockReturnValueOnce({ formattedResult: '01/01/2025' });

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toHaveLength(2);
        expect(result[0].date).toBe('01/01/2025'); // 2025 first
        expect(result[1].date).toBe('31/12/2024'); // 2024 second
      });
    });

    describe('Integration Tests', () => {
      it('should handle complex scenario with multiple dates and diagnoses', async () => {
        const mockDiagnoses = [
          createMockDiagnosis({
            id: 'diagnosis-1',
            code: { text: 'Diabetes' },
            recordedDate: '2025-03-25T06:48:32+00:00',
            verificationStatus: {
              coding: [
                { code: 'confirmed', display: 'Confirmed', system: 'test' },
              ],
            },
          }),
          createMockDiagnosis({
            id: 'diagnosis-2',
            code: { text: 'Hypertension' },
            recordedDate: '2025-03-25T14:30:15+00:00',
            verificationStatus: {
              coding: [
                { code: 'Provisional', display: 'Provisional', system: 'test' },
              ],
            },
          }),
          createMockDiagnosis({
            id: 'diagnosis-3',
            code: { text: 'Asthma' },
            recordedDate: '2025-03-24T10:15:00+00:00',
            verificationStatus: {
              coding: [
                { code: 'confirmed', display: 'Confirmed', system: 'test' },
              ],
            },
          }),
        ];

        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);
        mockFormatDate
          .mockReturnValueOnce({ formattedResult: '25/03/2025' })
          .mockReturnValueOnce({ formattedResult: '25/03/2025' })
          .mockReturnValueOnce({ formattedResult: '24/03/2025' });

        const result = await getPatientDiagnosesByDate(patientUUID);

        expect(result).toHaveLength(2);

        // First date group (newer)
        expect(result[0].date).toBe('25/03/2025');
        expect(result[0].diagnoses).toHaveLength(2);
        expect(result[0].diagnoses[0].display).toBe('Diabetes');
        expect(result[0].diagnoses[0].certainty).toEqual(
          CERTAINITY_CONCEPTS[0],
        ); // confirmed
        expect(result[0].diagnoses[1].display).toBe('Hypertension');
        expect(result[0].diagnoses[1].certainty).toEqual(
          CERTAINITY_CONCEPTS[1],
        ); // provisional

        // Second date group (older)
        expect(result[1].date).toBe('24/03/2025');
        expect(result[1].diagnoses).toHaveLength(1);
        expect(result[1].diagnoses[0].display).toBe('Asthma');
        expect(result[1].diagnoses[0].certainty).toEqual(
          CERTAINITY_CONCEPTS[0],
        ); // confirmed
      });

      it('should call all dependent functions in correct order', async () => {
        const mockDiagnoses = [createMockDiagnosis()];
        (get as jest.Mock).mockResolvedValueOnce(mockDiagnoses);

        await getPatientDiagnosesByDate(patientUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/Condition?category=encounter-diagnosis&patient=${patientUUID}`,
        );
        expect(mockFormatDate).toHaveBeenCalledWith(
          '2025-03-25T06:48:32+00:00',
        );
      });
    });
  });
});
