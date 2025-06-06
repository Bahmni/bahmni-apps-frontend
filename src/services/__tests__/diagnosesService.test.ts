import { getPatientDiagnosisBundle } from '../diagnosesService';
import { get } from '../api';
import { Condition } from 'fhir/r4';

jest.mock('../api');

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
});
