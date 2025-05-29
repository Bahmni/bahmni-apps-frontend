import { Reference, Condition } from 'fhir/r4';
import {
  createDiagnosisBundleEntries,
  postConsultationBundle,
} from '../consultationBundleService';
import { CONSULTATION_ERROR_MESSAGES } from '@constants/errors';
import { Coding } from 'fhir/r4';
import { post } from '../api';
import { DiagnosisInputEntry } from '@types/diagnosis';

// Mock crypto.randomUUID
const mockUUID = '1d87ab20-8b86-4b41-a30d-984b2208d945';
global.crypto.randomUUID = jest.fn().mockReturnValue(mockUUID);
jest.mock('../api');

describe('consultationBundleService', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('createDiagnosisBundleEntries', () => {
    const mockEncounterSubject: Reference = {
      reference: 'Patient/123',
    };

    const mockEncounterReference = 'Encounter/456';
    const mockPractitionerUUID = 'practitioner-789';

    const mockDiagnosis: DiagnosisInputEntry = {
      id: 'diagnosis-123',
      title: 'Test Diagnosis',
      selectedCertainty: {
        code: 'confirmed',
        system: 'test-system',
        display: 'Confirmed',
      } as Coding,
      errors: {},
      hasBeenValidated: false,
    };

    it('should create bundle entries for valid diagnoses', () => {
      const result = createDiagnosisBundleEntries({
        selectedDiagnoses: [mockDiagnosis],
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0].request?.method).toBe('POST');
      expect(result[0].resource?.resourceType).toBe('Condition');
    });

    it('should handle empty diagnoses array', () => {
      const result = createDiagnosisBundleEntries({
        selectedDiagnoses: [],
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should throw error when selectedDiagnoses is null', () => {
      expect(() =>
        createDiagnosisBundleEntries({
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          selectedDiagnoses: null as any,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        }),
      ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_DIAGNOSIS_PARAMS);
    });

    it('should throw error when encounterSubject is missing', () => {
      expect(() =>
        createDiagnosisBundleEntries({
          selectedDiagnoses: [mockDiagnosis],
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          encounterSubject: null as any,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        }),
      ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT);
    });

    it('should throw error when encounterReference is missing', () => {
      expect(() =>
        createDiagnosisBundleEntries({
          selectedDiagnoses: [mockDiagnosis],
          encounterSubject: mockEncounterSubject,
          encounterReference: '',
          practitionerUUID: mockPractitionerUUID,
        }),
      ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_REFERENCE);
    });

    it('should throw error when practitionerUUID is missing', () => {
      expect(() =>
        createDiagnosisBundleEntries({
          selectedDiagnoses: [mockDiagnosis],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: '',
        }),
      ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_PRACTITIONER);
    });

    it('should throw error for diagnoses without certainty code', () => {
      const diagnosisWithoutCertainty: DiagnosisInputEntry = {
        ...mockDiagnosis,
        selectedCertainty: null,
      };

      const diagnosisWithUndefinedCode: DiagnosisInputEntry = {
        ...mockDiagnosis,
        selectedCertainty: {
          system: 'test-system',
          display: 'Test',
          code: undefined,
        } as Coding,
      };
      expect(() =>
        createDiagnosisBundleEntries({
          selectedDiagnoses: [
            diagnosisWithoutCertainty,
            diagnosisWithUndefinedCode,
          ],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        }),
      ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_DIAGNOSIS_PARAMS);
    });

    it('should handle provisional certainty', () => {
      const provisionalDiagnosis: DiagnosisInputEntry = {
        ...mockDiagnosis,
        selectedCertainty: {
          code: 'provisional',
          system: 'test-system',
          display: 'Provisional',
        } as Coding,
      };

      const result = createDiagnosisBundleEntries({
        selectedDiagnoses: [provisionalDiagnosis],
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      const condition = result[0].resource as Condition;
      expect(condition.verificationStatus?.coding?.[0]?.code).toBe(
        'provisional',
      );
    });
  });

  describe('postConsultationBundle', () => {
    it('should call post with the correct URL and payload', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockBundle = { resourceType: 'ConsultationBundle' } as any;
      const mockResponse = { status: 'success' };

      (post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postConsultationBundle(mockBundle);

      expect(post).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/ConsultationBundle`,
        mockBundle,
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
