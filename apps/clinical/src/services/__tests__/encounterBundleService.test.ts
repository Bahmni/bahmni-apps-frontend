import { DiagnosisInputEntry, post, Form2Observation } from '@bahmni/services';
import {
  Reference,
  Condition,
  AllergyIntolerance,
  ServiceRequest,
  Coding,
  Observation,
} from 'fhir/r4';
import { CONSULTATION_ERROR_MESSAGES } from '../../constants/errors';
import { AllergyInputEntry } from '../../models/allergy';
import { ConditionInputEntry } from '../../models/condition';
import { FhirEncounter } from '../../models/encounter';
import { ServiceRequestInputEntry } from '../../models/serviceRequest';
import {
  createDiagnosisBundleEntries,
  createAllergiesBundleEntries,
  createServiceRequestBundleEntries,
  createConditionsBundleEntries,
  postEncounterBundle,
  createEncounterBundleEntry,
  getEncounterReference,
  createObservationBundleEntries,
} from '../encounterBundleService';

// Mock crypto.randomUUID
const mockUUID = '1d87ab20-8b86-4b41-a30d-984b2208d945';
global.crypto.randomUUID = jest.fn().mockReturnValue(mockUUID);
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  post: jest.fn(),
}));
jest.mock('@bahmni/form2-controls', () => ({
  getFhirObservations: jest.fn().mockImplementation((observations: any[]) => {
    let idCounter = 0;

    const processObservations = (obs: any[]): any[] => {
      const localResults: any[] = [];

      obs.forEach((o) => {
        const currentId = `mock-id-${idCounter++}`;
        const currentFullUrl = `urn:uuid:${currentId}`;

        if (o.groupMembers && o.groupMembers.length > 0) {
          const memberResults = processObservations(o.groupMembers);
          localResults.push(...memberResults);

          const parentObservation: Observation = {
            resourceType: 'Observation',
            id: currentId,
            status: 'final',
            code: { coding: [{ code: o.concept?.uuid }] },
            hasMember: memberResults.map((m) => ({
              reference: m.fullUrl,
              type: 'Observation',
            })) as any[],
          };

          localResults.push({
            resource: parentObservation,
            fullUrl: currentFullUrl,
          });
        } else {
          const childObservation: Observation = {
            resourceType: 'Observation',
            id: currentId,
            status: 'final',
            code: { coding: [{ code: o.concept?.uuid }] },
          };

          localResults.push({
            resource: childObservation,
            fullUrl: currentFullUrl,
          });
        }
      });

      return localResults;
    };

    return processObservations(observations);
  }),
}));

describe('encounterBundleService', () => {
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
      const mockDate = new Date('2025-01-01T10:00:00Z');
      const result = createDiagnosisBundleEntries({
        selectedDiagnoses: [mockDiagnosis],
        encounterSubject: mockEncounterSubject,
        encounterReference: mockDiagnosisEncounterReference,
        practitionerUUID: mockDiagnosisPractitionerUUID,
        consultationDate: mockDate,
      });

      const condition = result[0].resource as Condition;
      expect(condition.recordedDate).toBe('2025-01-01T10:00:00.000Z');

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0].request?.method).toBe('POST');
      expect(result[0].resource?.resourceType).toBe('Condition');
    });

    it('should handle empty diagnoses array', () => {
      const result = createDiagnosisBundleEntries({
        selectedDiagnoses: [],
        encounterSubject: mockEncounterSubject,
        encounterReference: mockDiagnosisEncounterReference,
        practitionerUUID: mockDiagnosisPractitionerUUID,
        consultationDate: new Date(),
      });

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });

    it('should throw error when selectedDiagnoses is null', () => {
      expect(() =>
        createDiagnosisBundleEntries({
          selectedDiagnoses: null as any,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockDiagnosisEncounterReference,
          practitionerUUID: mockDiagnosisPractitionerUUID,
          consultationDate: new Date(),
        }),
      ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_DIAGNOSIS_PARAMS);
    });

    it('should throw error when encounterSubject is missing', () => {
      expect(() =>
        createDiagnosisBundleEntries({
          selectedDiagnoses: [mockDiagnosis],

          encounterSubject: null as any,
          encounterReference: mockDiagnosisEncounterReference,
          practitionerUUID: mockDiagnosisPractitionerUUID,
          consultationDate: new Date(),
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
          consultationDate: new Date(),
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
          consultationDate: new Date(),
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
          consultationDate: new Date(),
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
        consultationDate: new Date(),
      });

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      const condition = result[0].resource as Condition;
      expect(condition.verificationStatus?.coding?.[0]?.code).toBe(
        'provisional',
      );
    });
  });

  describe('postEncounterBundle', () => {
    it('should call post with the correct URL and payload', async () => {
      const mockBundle = { resourceType: 'EncounterBundle' } as any;
      const mockResponse = { status: 'success' };

      (post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postEncounterBundle(mockBundle);

      expect(post).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/EncounterBundle`,
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

      it('should include note in FHIR resource when note is provided', () => {
        const allergyWithNote: AllergyInputEntry = {
          ...mockValidAllergy,
          note: 'Patient reports severe allergic reaction with swelling',
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithNote],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        const allergyResource = result[0].resource as AllergyIntolerance;
        expect(allergyResource.note).toEqual([
          {
            text: 'Patient reports severe allergic reaction with swelling',
          },
        ]);
      });

      it('should not include note field when note is undefined', () => {
        const allergyWithoutNote: AllergyInputEntry = {
          ...mockValidAllergy,
          note: undefined,
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithoutNote],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const allergyResource = result[0].resource as AllergyIntolerance;
        expect(allergyResource).not.toHaveProperty('note');
      });

      it('should not include note field when note is empty string', () => {
        const allergyWithEmptyNote: AllergyInputEntry = {
          ...mockValidAllergy,
          note: '',
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithEmptyNote],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const allergyResource = result[0].resource as AllergyIntolerance;
        expect(allergyResource).not.toHaveProperty('note');
      });

      it('should handle multiple allergies with mixed note presence', () => {
        const allergyWithNote: AllergyInputEntry = {
          ...mockValidAllergy,
          id: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          note: 'First allergy note',
        };

        const allergyWithoutNote: AllergyInputEntry = {
          ...mockValidAllergy,
          id: '162537AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          note: undefined,
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithNote, allergyWithoutNote],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);

        const firstResource = result[0].resource as AllergyIntolerance;
        const secondResource = result[1].resource as AllergyIntolerance;

        expect(firstResource.note).toEqual([{ text: 'First allergy note' }]);
        expect(secondResource).not.toHaveProperty('note');
      });

      it('should handle special characters in note text', () => {
        const allergyWithSpecialNote: AllergyInputEntry = {
          ...mockValidAllergy,
          note: 'Patient says: "I get rash & swelling when taking <medication>"',
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithSpecialNote],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const allergyResource = result[0].resource as AllergyIntolerance;
        expect(allergyResource.note).toEqual([
          {
            text: 'Patient says: "I get rash & swelling when taking <medication>"',
          },
        ]);
      });
    });

    describe('Existing allergy (PUT) paths', () => {
      const mockRawFhirResource: AllergyIntolerance = {
        resourceType: 'AllergyIntolerance',
        id: 'allergy-uuid-123',
        clinicalStatus: {
          coding: [
            {
              system:
                'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
              code: 'active',
              display: 'Active',
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system:
                'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
              code: 'confirmed',
            },
          ],
        },
        type: 'allergy',
        category: ['medication' as const],
        code: {
          coding: [
            {
              code: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              display: 'Penicillin',
            },
          ],
          text: 'Penicillin',
        },
        patient: { reference: 'Patient/patient-123' },
        reaction: [
          {
            manifestation: [
              {
                coding: [
                  {
                    code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                    display: 'Rash',
                  },
                  { system: 'http://snomed.info/sct', code: '271807003' },
                ],
                text: 'Rash',
              },
            ],
            severity: 'moderate' as const,
          },
        ],
      };

      const mockExistingAllergy: AllergyInputEntry = {
        ...mockValidAllergy,
        resourceId: 'allergy-uuid-123',
        isModified: true,
        rawFhirResource: mockRawFhirResource,
      };

      it('should use PUT method and AllergyIntolerance/{uuid} URL for existing allergy', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockExistingAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        expect(result[0].fullUrl).toBe('AllergyIntolerance/allergy-uuid-123');
        expect(
          (result[0].request as { method: string; url: string }).method,
        ).toBe('PUT');
        expect((result[0].request as { method: string; url: string }).url).toBe(
          'AllergyIntolerance/allergy-uuid-123',
        );
      });

      it('should preserve all rawFhirResource fields (clinicalStatus, type, etc.) in PUT body', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockExistingAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const resource = result[0].resource as AllergyIntolerance;
        expect(resource.clinicalStatus).toBeDefined();
        expect(resource.type).toBe('allergy');
        expect(resource.id).toBe('allergy-uuid-123');
      });

      it('should update severity from selectedSeverity in PUT body', () => {
        const allergyWithNewSeverity: AllergyInputEntry = {
          ...mockExistingAllergy,
          selectedSeverity: { code: 'severe', display: 'Severe' },
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithNewSeverity],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const resource = result[0].resource as AllergyIntolerance;
        expect(resource.reaction?.[0].severity).toBe('severe');
      });

      it('should reuse existing FHIR manifestation structure for known reaction codes', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockExistingAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const resource = result[0].resource as AllergyIntolerance;
        const manifestation = resource.reaction?.[0].manifestation?.[0];
        // Should reuse full FHIR structure including SNOMED code
        expect(manifestation?.coding?.length).toBeGreaterThan(1);
        expect(manifestation?.text).toBe('Rash');
      });

      it('should build minimal coding for new reactions not in rawFhirResource', () => {
        const allergyWithNewReaction: AllergyInputEntry = {
          ...mockExistingAllergy,
          selectedReactions: [
            { code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Rash' }, // existing
            { code: 'NEW_REACTION_CODE' }, // new
          ],
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithNewReaction],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const resource = result[0].resource as AllergyIntolerance;
        const manifestations = resource.reaction?.[0].manifestation ?? [];
        expect(manifestations).toHaveLength(2);
        // New reaction gets minimal coding
        const newReactionManifest = manifestations.find(
          (m) => m.coding?.[0]?.code === 'NEW_REACTION_CODE',
        );
        expect(newReactionManifest).toBeDefined();
        expect(newReactionManifest?.coding).toHaveLength(1);
      });

      it('should skip existing allergy when isModified is false', () => {
        const unmodifiedAllergy: AllergyInputEntry = {
          ...mockExistingAllergy,
          isModified: false,
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [unmodifiedAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        // Unmodified existing allergy is skipped entirely
        expect(result).toHaveLength(0);
      });

      it('should include modified existing allergy and skip unmodified one', () => {
        const unmodifiedAllergy: AllergyInputEntry = {
          ...mockExistingAllergy,
          id: 'allergen-A',
          resourceId: 'uuid-A',
          isModified: false,
        };
        const modifiedAllergy: AllergyInputEntry = {
          ...mockExistingAllergy,
          id: 'allergen-B',
          resourceId: 'uuid-B',
          isModified: true,
          rawFhirResource: {
            ...mockRawFhirResource,
            id: 'uuid-B',
          } as AllergyIntolerance,
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [unmodifiedAllergy, modifiedAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        expect(result[0].fullUrl).toBe('AllergyIntolerance/uuid-B');
      });

      it('should not include server-generated text field in PUT body', () => {
        const allergyWithText: AllergyInputEntry = {
          ...mockExistingAllergy,
          rawFhirResource: {
            ...mockRawFhirResource,
            text: {
              status: 'generated',
              div: '<div xmlns="http://www.w3.org/1999/xhtml">Common Types &amp; Triggers</div>',
            },
          },
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithText],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect((result[0].resource as AllergyIntolerance).text).toBeUndefined();
      });

      it('should use note from form state in PUT body', () => {
        const allergyWithNote: AllergyInputEntry = {
          ...mockExistingAllergy,
          note: 'Updated note from form',
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithNote],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect((result[0].resource as AllergyIntolerance).note).toEqual([
          { text: 'Updated note from form' },
        ]);
      });

      it('should clear note in PUT body when form note is empty', () => {
        const allergyWithClearedNote: AllergyInputEntry = {
          ...mockExistingAllergy,
          note: '',
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithClearedNote],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect((result[0].resource as AllergyIntolerance).note).toBeUndefined();
      });

      it('should POST (not PUT) for new allergy without resourceId', () => {
        const newAllergy: AllergyInputEntry = {
          ...mockValidAllergy,
          resourceId: undefined,
          rawFhirResource: undefined,
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [newAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect((result[0].request as { method: string }).method).toBe('POST');
        expect(result[0].fullUrl).toMatch(/^urn:uuid:/);
      });
    });

    describe('Cross-session allergy (DELETE + POST) paths', () => {
      const mockRawFhirWithOldEncounter: AllergyIntolerance = {
        resourceType: 'AllergyIntolerance',
        id: 'allergy-uuid-old',
        clinicalStatus: {
          coding: [
            {
              system:
                'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
              code: 'active',
            },
          ],
        },
        code: {
          coding: [{ code: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' }],
          text: 'Penicillin',
        },
        patient: { reference: 'Patient/patient-123' },
        encounter: { reference: 'Encounter/old-encounter-uuid' },
        reaction: [
          {
            manifestation: [
              {
                coding: [
                  {
                    code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                    display: 'Rash',
                  },
                ],
              },
            ],
            severity: 'moderate' as const,
          },
        ],
      };

      const mockCrossSessionAllergy: AllergyInputEntry = {
        id: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        display: 'Penicillin',
        type: 'medication',
        selectedSeverity: { code: 'mild', display: 'Mild' },
        selectedReactions: [
          { code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Rash' },
        ],
        errors: {},
        hasBeenValidated: true,
        resourceId: 'allergy-uuid-old',
        isModified: true,
        rawFhirResource: mockRawFhirWithOldEncounter,
      };

      // mockEncounterReference = 'urn:uuid:12345'
      // allergy encounter = 'Encounter/old-encounter-uuid'
      // 'Encounter/old-encounter-uuid' !== 'Encounter/urn:uuid:12345' → cross-session

      it('produces exactly two entries: DELETE first, POST second', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockCrossSessionAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
      });

      it('first entry is DELETE with correct URL for the old allergy', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockCrossSessionAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(
          (result[0].request as { method: string; url: string }).method,
        ).toBe('DELETE');
        expect((result[0].request as { method: string; url: string }).url).toBe(
          'AllergyIntolerance/allergy-uuid-old',
        );
        expect(result[0].fullUrl).toBe('AllergyIntolerance/allergy-uuid-old');
      });

      it('second entry is POST with a new urn:uuid URL', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockCrossSessionAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(
          (result[1].request as { method: string; url: string }).method,
        ).toBe('POST');
        expect(result[1].fullUrl).toMatch(/^urn:uuid:/);
      });

      it('POST resource carries the current encounter reference', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockCrossSessionAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const postResource = result[1].resource as AllergyIntolerance;
        expect(postResource.encounter?.reference).toBe(mockEncounterReference);
      });

      it('POST resource carries the user-edited severity', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockCrossSessionAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const postResource = result[1].resource as AllergyIntolerance;
        expect(postResource.reaction?.[0].severity).toBe('mild');
      });

      it('POST resource carries the note from the allergy entry', () => {
        const allergyWithNote: AllergyInputEntry = {
          ...mockCrossSessionAllergy,
          note: 'Cross-session allergy note',
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithNote],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect((result[1].resource as AllergyIntolerance).note).toEqual([
          { text: 'Cross-session allergy note' },
        ]);
      });

      it('skips cross-session allergy when isModified is false', () => {
        const unmodified: AllergyInputEntry = {
          ...mockCrossSessionAllergy,
          isModified: false,
        };
        const result = createAllergiesBundleEntries({
          selectedAllergies: [unmodified],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(0);
      });

      it('uses PUT when encounterReference is Encounter/uuid format matching the allergy encounter', () => {
        // encounterReference from getEncounterReference() is already 'Encounter/uuid'
        const result = createAllergiesBundleEntries({
          selectedAllergies: [
            {
              ...mockCrossSessionAllergy,
              // allergy encounter matches current — same session
              rawFhirResource: {
                ...mockRawFhirWithOldEncounter,
                encounter: { reference: 'Encounter/current-enc' },
              } as AllergyIntolerance,
            },
          ],
          encounterSubject: mockEncounterSubject,
          encounterReference: 'Encounter/current-enc', // full format, same as allergy
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        expect((result[0].request as { method: string }).method).toBe('PUT');
      });

      it('uses DELETE+POST when encounterReference is Encounter/uuid format differing from allergy encounter', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockCrossSessionAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: 'Encounter/current-enc', // full format, different from allergy
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
        expect((result[0].request as { method: string }).method).toBe('DELETE');
        expect((result[1].request as { method: string }).method).toBe('POST');
      });

      it('defaults to PUT when rawFhirResource has no encounter (legacy data)', () => {
        const legacyAllergy: AllergyInputEntry = {
          ...mockCrossSessionAllergy,
          rawFhirResource: {
            ...mockRawFhirWithOldEncounter,
            encounter: undefined,
          },
        };
        const result = createAllergiesBundleEntries({
          selectedAllergies: [legacyAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        expect((result[0].request as { method: string }).method).toBe('PUT');
      });
    });

    describe('Same-session reaction removal (DELETE+POST) paths', () => {
      const mockRawFhirWithTwoReactions: AllergyIntolerance = {
        resourceType: 'AllergyIntolerance',
        id: 'allergy-same-session',
        clinicalStatus: {
          coding: [
            {
              system:
                'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
              code: 'active',
            },
          ],
        },
        code: {
          coding: [
            {
              code: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              display: 'Penicillin',
            },
          ],
          text: 'Penicillin',
        },
        patient: { reference: 'Patient/patient-123' },
        encounter: { reference: mockEncounterReference },
        reaction: [
          {
            manifestation: [
              {
                coding: [
                  {
                    code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                    display: 'Rash',
                  },
                ],
                text: 'Rash',
              },
            ],
            severity: 'moderate' as const,
          },
          {
            manifestation: [
              {
                coding: [
                  {
                    code: '121629AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                    display: 'Anaemia',
                  },
                ],
                text: 'Anaemia',
              },
            ],
            severity: 'moderate' as const,
          },
        ],
      };

      const mockSameSessionAllergyWithReactionRemoved: AllergyInputEntry = {
        id: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        display: 'Penicillin',
        type: 'medication',
        selectedSeverity: { code: 'mild', display: 'Mild' },
        selectedReactions: [
          { code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Rash' },
        ],
        errors: {},
        hasBeenValidated: true,
        resourceId: 'allergy-same-session',
        isModified: true,
        rawFhirResource: mockRawFhirWithTwoReactions,
      };

      it('produces DELETE+POST when a reaction is removed in same session', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockSameSessionAllergyWithReactionRemoved],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
        expect((result[0].request as { method: string }).method).toBe('DELETE');
        expect((result[1].request as { method: string }).method).toBe('POST');
      });

      it('DELETE entry targets the existing allergy UUID', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockSameSessionAllergyWithReactionRemoved],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect((result[0].request as { url: string }).url).toBe(
          'AllergyIntolerance/allergy-same-session',
        );
        expect(result[0].fullUrl).toBe(
          'AllergyIntolerance/allergy-same-session',
        );
      });

      it('POST entry has only the remaining reaction, not the removed one', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockSameSessionAllergyWithReactionRemoved],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const postResource = result[1].resource as AllergyIntolerance;
        const manifestationCodes =
          postResource.reaction?.[0].manifestation.flatMap(
            (m) => m.coding?.map((c) => c.code) ?? [],
          );
        expect(manifestationCodes).toContain(
          '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        );
        expect(manifestationCodes).not.toContain(
          '121629AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        );
      });

      it('POST entry carries the updated severity', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockSameSessionAllergyWithReactionRemoved],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(
          (result[1].resource as AllergyIntolerance).reaction?.[0].severity,
        ).toBe('mild');
      });

      it('POST entry has a new urn:uuid URL', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockSameSessionAllergyWithReactionRemoved],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result[1].fullUrl).toMatch(/^urn:uuid:/);
      });

      it('POST entry carries the current encounter reference', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockSameSessionAllergyWithReactionRemoved],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const postResource = result[1].resource as AllergyIntolerance;
        expect(postResource.encounter?.reference).toBe(mockEncounterReference);
      });

      it('POST entry carries the note from the allergy entry', () => {
        const allergyWithNote: AllergyInputEntry = {
          ...mockSameSessionAllergyWithReactionRemoved,
          note: 'Reaction note for same session',
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithNote],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect((result[1].resource as AllergyIntolerance).note).toEqual([
          { text: 'Reaction note for same session' },
        ]);
      });

      it('uses PUT when reactions are only added or unchanged in same session', () => {
        const allergyWithReactionAdded: AllergyInputEntry = {
          ...mockSameSessionAllergyWithReactionRemoved,
          selectedReactions: [
            { code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Rash' },
            {
              code: '121629AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              display: 'Anaemia',
            },
            { code: '143264AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Cough' },
          ],
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [allergyWithReactionAdded],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        expect((result[0].request as { method: string }).method).toBe('PUT');
      });
    });

    describe('createEncounterBundleEntry', () => {
      const mockEncounterResource = {
        resourceType: 'Encounter',
        status: 'in-progress',
        subject: { reference: 'Patient/123' },
      };

      describe('Happy Path', () => {
        it('should create POST bundle entry for new encounter when no active encounter exists', () => {
          const result = createEncounterBundleEntry(
            null,
            mockEncounterResource,
          );

          expect(result.fullUrl).toMatch(/^urn:uuid:/);
          expect(result.resource).toBe(mockEncounterResource);
          expect(result.request?.method).toBe('POST');
          expect(result.request?.url).toBe('Encounter');
        });

        it('should create PUT bundle entry for existing encounter when active encounter exists', () => {
          const activeEncounter: FhirEncounter = {
            resourceType: 'Encounter',
            id: 'encounter-123',
            status: 'in-progress',
            subject: { reference: 'Patient/123' },
          };

          const result = createEncounterBundleEntry(
            activeEncounter,
            mockEncounterResource,
          );

          expect(result.fullUrl).toBe('Encounter/encounter-123');
          expect(result.resource).toEqual({
            ...mockEncounterResource,
            id: 'encounter-123',
          });
          expect(result.request?.method).toBe('PUT');
          expect(result.request?.url).toBe('Encounter/encounter-123');
        });
      });

      describe('Edge Cases', () => {
        it('should handle active encounter without id gracefully', () => {
          const activeEncounterWithoutId = {
            resourceType: 'Encounter' as const,
            status: 'in-progress' as const,
            subject: { reference: 'Patient/123' },
          };

          const result = createEncounterBundleEntry(
            activeEncounterWithoutId,
            mockEncounterResource,
          );

          expect(result.fullUrl).toBe('Encounter/undefined');
          expect(result.resource).toEqual({
            ...mockEncounterResource,
            id: undefined,
          });
          expect(result.request?.method).toBe('PUT');
          expect(result.request?.url).toBe('Encounter/undefined');
        });

        it('should handle empty encounter resource', () => {
          const emptyResource = {};
          const result = createEncounterBundleEntry(null, emptyResource);

          expect(result.fullUrl).toMatch(/^urn:uuid:/);
          expect(result.resource).toBe(emptyResource);
          expect(result.request?.method).toBe('POST');
          expect(result.request?.url).toBe('Encounter');
        });
      });
    });

    describe('getEncounterReference', () => {
      describe('Happy Path', () => {
        it('should return encounter reference for active encounter', () => {
          const activeEncounter: FhirEncounter = {
            resourceType: 'Encounter',
            id: 'encounter-123',
            status: 'in-progress',
            subject: {
              reference: 'Patient/123',
              type: '',
              display: '',
            },
            meta: {
              versionId: '',
              lastUpdated: '',
              tag: [],
            },
            class: {
              system: '',
              code: '',
            },
            type: [],
            period: undefined,
            location: [],
          };

          const result = getEncounterReference(
            activeEncounter,
            'placeholder-ref',
          );

          expect(result).toBe('Encounter/encounter-123');
        });

        it('should return placeholder reference when no active encounter', () => {
          const placeholderRef = 'urn:uuid:placeholder-123';

          const result = getEncounterReference(null, placeholderRef);

          expect(result).toBe(placeholderRef);
        });
      });

      describe('Edge Cases', () => {
        it('should handle active encounter without id', () => {
          const activeEncounterWithoutId = {
            resourceType: 'Encounter' as const,
            status: 'in-progress' as const,
            subject: { reference: 'Patient/123' },
          };

          const result = getEncounterReference(
            activeEncounterWithoutId,
            'placeholder-ref',
          );

          expect(result).toBe('Encounter/undefined');
        });

        it('should handle empty placeholder reference', () => {
          const result = getEncounterReference(null, '');

          expect(result).toBe('');
        });

        it('should handle null active encounter', () => {
          const result = getEncounterReference(null, 'urn:uuid:test-123');

          expect(result).toBe('urn:uuid:test-123');
        });
      });
    });
  });

  describe('createServiceRequestBundleEntries', () => {
    const mockServiceRequest: ServiceRequestInputEntry = {
      uid: 'uid-service-request-123',
      id: 'service-request-123',
      display: 'Blood Test',
      selectedPriority: 'routine',
    };

    const mockStatServiceRequest: ServiceRequestInputEntry = {
      uid: 'uid-service-request-456',
      id: 'service-request-456',
      display: 'Emergency CT Scan',
      selectedPriority: 'stat',
    };

    describe('Happy Paths', () => {
      it('should create bundle entries for valid service requests', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [mockServiceRequest]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        const serviceRequest = result[0].resource as ServiceRequest;
        expect(serviceRequest.resourceType).toBe('ServiceRequest');
        expect(serviceRequest.code?.coding?.[0]?.code).toBe(
          mockServiceRequest.id,
        );
        expect(serviceRequest.subject).toEqual(mockEncounterSubject);
        expect(serviceRequest.encounter?.reference).toBe(
          mockEncounterReference,
        );
        expect(serviceRequest.requester?.reference).toBe(
          `Practitioner/${mockPractitionerUUID}`,
        );
        expect(serviceRequest.priority).toBe('routine');
        expect(result[0].request?.method).toBe('POST');
        expect(result[0].fullUrl).toBe(`urn:uuid:${mockUUID}`);
      });

      it('should handle multiple service requests in the same category', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [
          mockServiceRequest,
          mockStatServiceRequest,
        ]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
        const firstRequest = result[0].resource as ServiceRequest;
        const secondRequest = result[1].resource as ServiceRequest;

        expect(firstRequest.code?.coding?.[0]?.code).toBe(
          mockServiceRequest.id,
        );
        expect(firstRequest.priority).toBe('routine');

        expect(secondRequest.code?.coding?.[0]?.code).toBe(
          mockStatServiceRequest.id,
        );
        expect(secondRequest.priority).toBe('stat');
      });

      it('should handle multiple categories with multiple service requests', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [mockServiceRequest]);
        serviceRequestsMap.set('radiology', [mockStatServiceRequest]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
        const labRequest = result.find(
          (entry) =>
            (entry.resource as ServiceRequest).code?.coding?.[0]?.code ===
            mockServiceRequest.id,
        );
        const radiologyRequest = result.find(
          (entry) =>
            (entry.resource as ServiceRequest).code?.coding?.[0]?.code ===
            mockStatServiceRequest.id,
        );

        expect(labRequest).toBeDefined();
        expect(radiologyRequest).toBeDefined();
      });

      it('should handle stat priority correctly', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('emergency', [mockStatServiceRequest]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const serviceRequest = result[0].resource as ServiceRequest;
        expect(serviceRequest.priority).toBe('stat');
      });
    });

    describe('Sad Paths - Validation Errors', () => {
      it('should throw error for missing encounter subject', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [mockServiceRequest]);

        expect(() =>
          createServiceRequestBundleEntries({
            selectedServiceRequests: serviceRequestsMap,

            encounterSubject: null as any,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT);
      });

      it('should throw error for encounter subject without reference', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [mockServiceRequest]);

        expect(() =>
          createServiceRequestBundleEntries({
            selectedServiceRequests: serviceRequestsMap,
            encounterSubject: {} as Reference,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT);
      });

      it('should throw error for missing encounter reference', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [mockServiceRequest]);

        expect(() =>
          createServiceRequestBundleEntries({
            selectedServiceRequests: serviceRequestsMap,
            encounterSubject: mockEncounterSubject,
            encounterReference: '',
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_REFERENCE);
      });

      it('should throw error for null encounter reference', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [mockServiceRequest]);

        expect(() =>
          createServiceRequestBundleEntries({
            selectedServiceRequests: serviceRequestsMap,
            encounterSubject: mockEncounterSubject,

            encounterReference: null as any,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_REFERENCE);
      });

      it('should throw error for missing practitioner UUID', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [mockServiceRequest]);

        expect(() =>
          createServiceRequestBundleEntries({
            selectedServiceRequests: serviceRequestsMap,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: '',
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_PRACTITIONER);
      });

      it('should throw error for null practitioner UUID', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [mockServiceRequest]);

        expect(() =>
          createServiceRequestBundleEntries({
            selectedServiceRequests: serviceRequestsMap,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,

            practitionerUUID: null as any,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_PRACTITIONER);
      });
    });

    describe('Edge Cases', () => {
      it('should return empty array for empty Map', () => {
        const emptyMap = new Map<string, ServiceRequestInputEntry[]>();

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: emptyMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toEqual([]);
      });

      it('should skip categories with empty arrays', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', []);
        serviceRequestsMap.set('radiology', [mockServiceRequest]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        const serviceRequest = result[0].resource as ServiceRequest;
        expect(serviceRequest.code?.coding?.[0]?.code).toBe(
          mockServiceRequest.id,
        );
      });

      it('should skip categories with null values', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();

        serviceRequestsMap.set('lab', null as any);
        serviceRequestsMap.set('radiology', [mockServiceRequest]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        const serviceRequest = result[0].resource as ServiceRequest;
        expect(serviceRequest.code?.coding?.[0]?.code).toBe(
          mockServiceRequest.id,
        );
      });

      it('should handle Map with all empty/null categories', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', []);

        serviceRequestsMap.set('radiology', null as any);
        serviceRequestsMap.set('other', []);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toEqual([]);
      });
    });

    describe('Integration with Bundle Creation', () => {
      it('should create valid bundle entries with correct structure', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [mockServiceRequest]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        // Verify bundle entry structure
        expect(result[0]).toHaveProperty('fullUrl');
        expect(result[0]).toHaveProperty('resource');
        expect(result[0]).toHaveProperty('request');
        expect(result[0].request).toEqual({
          method: 'POST',
          url: 'ServiceRequest',
        });
      });
    });

    describe('Note Handling', () => {
      it('should include note in service request resource when note is provided', () => {
        const serviceRequestWithNote: ServiceRequestInputEntry = {
          ...mockServiceRequest,
          note: 'Patient requires fasting before test',
        };

        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [serviceRequestWithNote]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const serviceRequest = result[0].resource as ServiceRequest;
        expect(serviceRequest.note).toBeDefined();
        expect(serviceRequest.note).toHaveLength(1);
        expect(serviceRequest.note![0].text).toBe(
          'Patient requires fasting before test',
        );
      });

      it('should not include note field when note is undefined', () => {
        const serviceRequestWithoutNote: ServiceRequestInputEntry = {
          ...mockServiceRequest,
          note: undefined,
        };

        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [serviceRequestWithoutNote]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const serviceRequest = result[0].resource as ServiceRequest;
        expect(serviceRequest.note).toBeUndefined();
      });

      it('should handle multiple service requests with mixed note presence', () => {
        const requestWithNote: ServiceRequestInputEntry = {
          ...mockServiceRequest,
          id: 'req-1',
          note: 'First request note',
        };

        const requestWithoutNote: ServiceRequestInputEntry = {
          ...mockServiceRequest,
          id: 'req-2',
          note: undefined,
        };

        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [requestWithNote, requestWithoutNote]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);

        const firstRequest = result[0].resource as ServiceRequest;
        const secondRequest = result[1].resource as ServiceRequest;

        expect(firstRequest.note).toBeDefined();
        expect(firstRequest.note![0].text).toBe('First request note');
        expect(secondRequest.note).toBeUndefined();
      });
    });
  });

  describe('createConditionsBundleEntries', () => {
    const mockValidCondition: ConditionInputEntry = {
      id: '162539AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      display: 'Diabetes Mellitus',
      durationValue: 2,
      durationUnit: 'years',
      errors: {},
      hasBeenValidated: true,
    };

    describe('Happy Path Tests', () => {
      it('should create bundle entries for valid conditions', () => {
        const mockDate = new Date('2025-01-15T10:30:00Z');
        const result = createConditionsBundleEntries({
          selectedConditions: [mockValidCondition],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: mockDate,
        });

        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(1);
        expect(result[0].request?.method).toBe('POST');
        expect(result[0].resource?.resourceType).toBe('Condition');

        const condition = result[0].resource as Condition;
        expect(condition.recordedDate).toBe('2025-01-15T10:30:00.000Z');
        expect(condition.onsetDateTime).toBeDefined(); // Should be calculated from duration
        expect(condition.category?.[0]?.coding?.[0]?.code).toBe(
          'problem-list-item',
        );
      });

      it('should handle multiple conditions correctly', () => {
        const secondCondition: ConditionInputEntry = {
          id: '162540AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Hypertension',
          durationValue: 6,
          durationUnit: 'months',
          errors: {},
          hasBeenValidated: true,
        };

        const result = createConditionsBundleEntries({
          selectedConditions: [mockValidCondition, secondCondition],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: new Date('2025-01-15T10:30:00Z'),
        });

        expect(result).toHaveLength(2);
        const firstResource = result[0].resource as Condition;
        const secondResource = result[1].resource as Condition;
        expect(firstResource.code?.coding?.[0]?.code).toBe(
          mockValidCondition.id,
        );
        expect(secondResource.code?.coding?.[0]?.code).toBe(secondCondition.id);
      });

      it('should calculate onset date from duration correctly', () => {
        const mockDate = new Date('2025-01-15T10:30:00Z');
        const result = createConditionsBundleEntries({
          selectedConditions: [mockValidCondition],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: mockDate,
        });

        const condition = result[0].resource as Condition;
        expect(condition.onsetDateTime).toBeDefined();
        // 2 years ago from 2025-01-15 should be 2023-01-15
        expect(condition.onsetDateTime).toBe('2023-01-15T10:30:00.000Z');
      });

      it('should handle conditions with days duration', () => {
        const conditionWithDays: ConditionInputEntry = {
          ...mockValidCondition,
          durationValue: 30,
          durationUnit: 'days',
        };

        const mockDate = new Date('2025-01-15T10:30:00Z');
        const result = createConditionsBundleEntries({
          selectedConditions: [conditionWithDays],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: mockDate,
        });

        const condition = result[0].resource as Condition;
        // 30 days ago from 2025-01-15 should be 2024-12-16
        expect(condition.onsetDateTime).toBe('2024-12-16T10:30:00.000Z');
      });

      it('should handle conditions with months duration', () => {
        const conditionWithMonths: ConditionInputEntry = {
          ...mockValidCondition,
          durationValue: 3,
          durationUnit: 'months',
        };

        const mockDate = new Date('2025-01-15T10:30:00Z');
        const result = createConditionsBundleEntries({
          selectedConditions: [conditionWithMonths],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: mockDate,
        });

        const condition = result[0].resource as Condition;
        // 3 months ago from 2025-01-15 should be 2024-10-15
        expect(condition.onsetDateTime).toBe('2024-10-15T10:30:00.000Z');
      });
    });

    describe('Validation Tests (Sad Paths)', () => {
      it('should throw error for null/undefined selectedConditions', () => {
        expect(() =>
          createConditionsBundleEntries({
            selectedConditions: null as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
            consultationDate: new Date(),
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });

      it('should throw error for invalid encounterSubject', () => {
        expect(() =>
          createConditionsBundleEntries({
            selectedConditions: [mockValidCondition],

            encounterSubject: null as any,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
            consultationDate: new Date(),
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT);
      });

      it('should throw error for missing encounterReference', () => {
        expect(() =>
          createConditionsBundleEntries({
            selectedConditions: [mockValidCondition],
            encounterSubject: mockEncounterSubject,
            encounterReference: '',
            practitionerUUID: mockPractitionerUUID,
            consultationDate: new Date(),
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_REFERENCE);
      });

      it('should throw error for missing practitionerUUID', () => {
        expect(() =>
          createConditionsBundleEntries({
            selectedConditions: [mockValidCondition],
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: '',
            consultationDate: new Date(),
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_PRACTITIONER);
      });

      it('should throw error for conditions with invalid duration values', () => {
        const invalidCondition: ConditionInputEntry = {
          ...mockValidCondition,
          durationValue: null,
          durationUnit: 'days',
        };

        expect(() =>
          createConditionsBundleEntries({
            selectedConditions: [invalidCondition],
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
            consultationDate: new Date(),
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });

      it('should throw error for conditions with invalid duration units', () => {
        const invalidCondition: ConditionInputEntry = {
          ...mockValidCondition,
          durationValue: 5,
          durationUnit: null,
        };

        expect(() =>
          createConditionsBundleEntries({
            selectedConditions: [invalidCondition],
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
            consultationDate: new Date(),
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });
    });

    describe('Edge Cases', () => {
      it('should return empty array for empty conditions list', () => {
        const result = createConditionsBundleEntries({
          selectedConditions: [],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: new Date(),
        });

        expect(result).toEqual([]);
      });

      it('should handle conditions with zero duration', () => {
        const conditionWithZeroDuration: ConditionInputEntry = {
          ...mockValidCondition,
          durationValue: 0,
          durationUnit: 'days',
        };

        const mockDate = new Date('2025-01-15T10:30:00Z');
        const result = createConditionsBundleEntries({
          selectedConditions: [conditionWithZeroDuration],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: mockDate,
        });

        const condition = result[0].resource as Condition;
        // 0 days ago should be the same as consultation date
        expect(condition.onsetDateTime).toBe('2025-01-15T10:30:00.000Z');
      });

      it('should handle conditions with very large duration values', () => {
        const conditionWithLargeDuration: ConditionInputEntry = {
          ...mockValidCondition,
          durationValue: 50,
          durationUnit: 'years',
        };

        const mockDate = new Date('2025-01-15T10:30:00Z');
        const result = createConditionsBundleEntries({
          selectedConditions: [conditionWithLargeDuration],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: mockDate,
        });

        const condition = result[0].resource as Condition;
        // 50 years ago should be 1975-01-15
        expect(condition.onsetDateTime).toBe('1975-01-15T10:30:00.000Z');
      });

      it('should handle conditions with minimal Reference objects', () => {
        const minimalSubjectRef: Reference = { reference: 'Patient/123' };
        const minimalEncounterRef = 'Encounter/456';
        const minimalRecorderRef = 'practitioner-789';

        const result = createConditionsBundleEntries({
          selectedConditions: [mockValidCondition],
          encounterSubject: minimalSubjectRef,
          encounterReference: minimalEncounterRef,
          practitionerUUID: minimalRecorderRef,
          consultationDate: new Date('2025-01-15T10:30:00Z'),
        });

        expect(result).toHaveLength(1);
        const condition = result[0].resource as Condition;
        expect(condition.subject).toEqual(minimalSubjectRef);
      });

      it('should handle conditions without hasBeenValidated flag', () => {
        const conditionWithoutValidation: ConditionInputEntry = {
          ...mockValidCondition,
          hasBeenValidated: false,
        };

        const result = createConditionsBundleEntries({
          selectedConditions: [conditionWithoutValidation],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: new Date('2025-01-15T10:30:00Z'),
        });

        expect(result).toHaveLength(1);
        expect(result[0].resource?.resourceType).toBe('Condition');
      });
    });
  });

  describe('createObservationBundleEntries', () => {
    const mockObservations: Form2Observation[] = [
      {
        concept: { uuid: 'concept-uuid-1', datatype: 'Numeric' },
        value: 72,
        obsDatetime: '2025-01-15T10:30:00Z',
        formNamespace: 'Bahmni',
        formFieldPath: 'Vitals.1/1-0',
      },
    ];

    it('should create observation bundle entries using FhirObservationTransformer', () => {
      const result = createObservationBundleEntries({
        observationFormsData: { 'form-uuid-1': mockObservations },
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result).toHaveLength(1);
      expect(result[0].resource?.resourceType).toBe('Observation');
      expect(result[0].request?.method).toBe('POST');
      expect(result[0].fullUrl).toMatch(/^urn:uuid:/);
    });

    it('should handle observations with group members', () => {
      const groupedObservations: Form2Observation[] = [
        {
          concept: { uuid: 'group-uuid' },
          value: null,
          groupMembers: [
            {
              concept: { uuid: 'member-1-uuid', datatype: 'Numeric' },
              value: 100,
            },
            {
              concept: { uuid: 'member-2-uuid', datatype: 'Text' },
              value: 'test',
            },
          ],
        },
      ];

      const result = createObservationBundleEntries({
        observationFormsData: { 'form-uuid-1': groupedObservations },
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result).toHaveLength(3);
      const parentEntry = result.find(
        (entry) => (entry.resource as Observation)?.hasMember?.length,
      );
      expect(parentEntry).toBeDefined();
    });

    it('should throw error for invalid parameters', () => {
      expect(() =>
        createObservationBundleEntries({
          observationFormsData: null as any,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        }),
      ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
    });

    it('should handle empty observations array', () => {
      const result = createObservationBundleEntries({
        observationFormsData: { 'form-uuid-1': [] },
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result).toHaveLength(0);
    });

    describe('Parameter Validation - All 4 Paths', () => {
      it('should throw error when observationFormsData is null', () => {
        expect(() =>
          createObservationBundleEntries({
            observationFormsData: null as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });

      it('should throw error when encounterSubject is null', () => {
        expect(() =>
          createObservationBundleEntries({
            observationFormsData: { 'form-uuid-1': mockObservations },
            encounterSubject: null as any,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT);
      });

      it('should throw error when encounterReference is empty', () => {
        expect(() =>
          createObservationBundleEntries({
            observationFormsData: { 'form-uuid-1': mockObservations },
            encounterSubject: mockEncounterSubject,
            encounterReference: '',
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_REFERENCE);
      });

      it('should throw error when practitionerUUID is empty', () => {
        expect(() =>
          createObservationBundleEntries({
            observationFormsData: { 'form-uuid-1': mockObservations },
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: '',
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_PRACTITIONER);
      });
    });

    describe('Multiple Forms Handling', () => {
      it('should handle multiple forms with observations', () => {
        const obs2: Form2Observation[] = [
          {
            concept: { uuid: 'concept-uuid-2', datatype: 'Numeric' },
            value: 98.6,
          },
        ];

        const result = createObservationBundleEntries({
          observationFormsData: {
            'form-uuid-1': mockObservations,
            'form-uuid-2': obs2,
          },
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
        expect(
          result.every((r) => r.resource?.resourceType === 'Observation'),
        ).toBe(true);
      });

      it('should skip null form data in multiple forms', () => {
        const result = createObservationBundleEntries({
          observationFormsData: {
            'form-uuid-1': mockObservations,
            'form-uuid-2': null as any,
            'form-uuid-3': mockObservations,
          },
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
      });

      it('should create valid bundle structure for all entries', () => {
        const result = createObservationBundleEntries({
          observationFormsData: { 'form-uuid-1': mockObservations },
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        result.forEach((entry) => {
          expect(entry.fullUrl).toBeDefined();
          expect(entry.resource?.resourceType).toBe('Observation');
          expect(entry.request?.method).toBe('POST');
          expect(entry.request?.url).toBe('Observation');
        });
      });
    });
  });
});
