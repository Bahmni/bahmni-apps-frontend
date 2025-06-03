import { Reference, Condition, AllergyIntolerance } from 'fhir/r4';
import {
  createDiagnosisBundleEntries,
  createAllergiesBundleEntries,
  postConsultationBundle,
} from '../consultationBundleService';
import { CONSULTATION_ERROR_MESSAGES } from '@constants/errors';
import { Coding } from 'fhir/r4';
import { post } from '../api';
import { DiagnosisInputEntry } from '@types/diagnosis';
import { AllergyInputEntry } from '@types/allergy';

// Mock crypto.randomUUID
const mockUUID = '1d87ab20-8b86-4b41-a30d-984b2208d945';
global.crypto.randomUUID = jest.fn().mockReturnValue(mockUUID);
jest.mock('../api');

describe('consultationBundleService', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  const mockEncounterSubject: Reference = {
    reference: 'Patient/123',
  };

  const mockEncounterReference = 'urn:uuid:12345';
  const mockPractitionerUUID = 'd7a669e7-5e07-11ef-8f7c-0242ac120002';

  describe('createDiagnosisBundleEntries', () => {
    const mockDiagnosisEncounterReference = 'Encounter/456';
    const mockDiagnosisPractitionerUUID = 'practitioner-789';

    const mockDiagnosis: DiagnosisInputEntry = {
      id: 'diagnosis-123',
      display: 'Test Diagnosis',
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
        encounterReference: mockDiagnosisEncounterReference,
        practitionerUUID: mockDiagnosisPractitionerUUID,
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
        encounterReference: mockDiagnosisEncounterReference,
        practitionerUUID: mockDiagnosisPractitionerUUID,
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
          encounterReference: mockDiagnosisEncounterReference,
          practitionerUUID: mockDiagnosisPractitionerUUID,
        }),
      ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_DIAGNOSIS_PARAMS);
    });

    it('should throw error when encounterSubject is missing', () => {
      expect(() =>
        createDiagnosisBundleEntries({
          selectedDiagnoses: [mockDiagnosis],
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          encounterSubject: null as any,
          encounterReference: mockDiagnosisEncounterReference,
          practitionerUUID: mockDiagnosisPractitionerUUID,
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
          encounterReference: mockDiagnosisEncounterReference,
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
          encounterReference: mockDiagnosisEncounterReference,
          practitionerUUID: mockDiagnosisPractitionerUUID,
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
        encounterReference: mockDiagnosisEncounterReference,
        practitionerUUID: mockDiagnosisPractitionerUUID,
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

  describe('createAllergiesBundleEntries', () => {
    const mockValidAllergy: AllergyInputEntry = {
      id: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      display: 'Penicillin',
      type: 'medication',
      selectedSeverity: {
        code: 'moderate',
        display: 'Moderate',
      },
      selectedReactions: [
        {
          code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Rash',
        },
        {
          code: '117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Nausea',
        },
      ],
      errors: {},
      hasBeenValidated: true,
    };

    describe('Happy Paths', () => {
      it('should create bundle entries for valid allergies with all required fields', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockValidAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        const allergyResource = result[0].resource as AllergyIntolerance;
        expect(allergyResource.resourceType).toBe('AllergyIntolerance');
        expect(allergyResource.category).toEqual(['medication']);
        expect(allergyResource.code?.coding?.[0]?.code).toBe(
          mockValidAllergy.id,
        );
        expect(allergyResource.patient).toEqual(mockEncounterSubject);
        expect(allergyResource.encounter?.reference).toBe(
          mockEncounterReference,
        );
        expect(allergyResource.recorder?.reference).toBe(
          `Practitioner/${mockPractitionerUUID}`,
        );
        expect(allergyResource.reaction?.[0].manifestation).toHaveLength(2);
        expect(allergyResource.reaction?.[0].severity).toBe('moderate');
        expect(
          (result[0].request as { method: string; url: string }).method,
        ).toBe('POST');
        expect((result[0].request as { method: string; url: string }).url).toBe(
          'AllergyIntolerance',
        );
      });

      it('should handle multiple allergies correctly', () => {
        const secondAllergy = {
          ...mockValidAllergy,
          id: '162537AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Aspirin',
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockValidAllergy, secondAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
        const firstResource = result[0].resource as AllergyIntolerance;
        const secondResource = result[1].resource as AllergyIntolerance;
        expect(firstResource.code?.coding?.[0]?.code).toBe(mockValidAllergy.id);
        expect(secondResource.code?.coding?.[0]?.code).toBe(secondAllergy.id);
      });
    });

    describe('Sad Paths', () => {
      it('should throw error for invalid allergy params', () => {
        expect(() =>
          createAllergiesBundleEntries({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            selectedAllergies: null as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ALLERGY_PARAMS);
      });

      it('should throw error for missing encounter subject', () => {
        expect(() =>
          createAllergiesBundleEntries({
            selectedAllergies: [mockValidAllergy],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            encounterSubject: null as any,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT);
      });

      it('should throw error for missing encounter reference', () => {
        expect(() =>
          createAllergiesBundleEntries({
            selectedAllergies: [mockValidAllergy],
            encounterSubject: mockEncounterSubject,
            encounterReference: '',
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_REFERENCE);
      });

      it('should throw error for missing practitioner UUID', () => {
        expect(() =>
          createAllergiesBundleEntries({
            selectedAllergies: [mockValidAllergy],
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: '',
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_PRACTITIONER);
      });

      it('should throw error for allergy without severity', () => {
        const allergyWithoutSeverity = {
          ...mockValidAllergy,
          selectedSeverity: null,
        };

        expect(() =>
          createAllergiesBundleEntries({
            selectedAllergies: [allergyWithoutSeverity],
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ALLERGY_PARAMS);
      });

      it('should throw error for allergy without reactions', () => {
        const allergyWithoutReactions = {
          ...mockValidAllergy,
          selectedReactions: [],
        };

        expect(() =>
          createAllergiesBundleEntries({
            selectedAllergies: [allergyWithoutReactions],
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ALLERGY_PARAMS);
      });
    });

    describe('Edge Cases', () => {
      it('should return empty array for empty allergies list', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toEqual([]);
      });
    });
  });
});
