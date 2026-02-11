import { DiagnosisInputEntry, post, Form2Observation } from '@bahmni/services';
import {
  Reference,
  Condition,
  AllergyIntolerance,
  ServiceRequest,
  MedicationRequest,
  Coding,
  Observation,
} from 'fhir/r4';
import { CONSULTATION_ERROR_MESSAGES } from '../../constants/errors';
import { AllergyInputEntry } from '../../models/allergy';
import { ConditionInputEntry } from '../../models/condition';
import { FhirEncounter } from '../../models/encounter';
import { MedicationInputEntry } from '../../models/medication';
import { ServiceRequestInputEntry } from '../../models/serviceRequest';
import {
  createDiagnosisBundleEntries,
  createAllergiesBundleEntries,
  createServiceRequestBundleEntries,
  createConditionsBundleEntries,
  createMedicationRequestEntries,
  postConsultationBundle,
  createEncounterBundleEntry,
  getEncounterReference,
  createObservationBundleEntries,
} from '../consultationBundleService';

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

  describe('postConsultationBundle', () => {
    it('should call post with the correct URL and payload', async () => {
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
      id: 'service-request-123',
      display: 'Blood Test',
      selectedPriority: 'routine',
    };

    const mockStatServiceRequest: ServiceRequestInputEntry = {
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

  describe('createMedicationRequestEntries', () => {
    const mockMedicationEntry: MedicationInputEntry = {
      id: 'med-123',
      medication: {
        resourceType: 'Medication',
        id: 'med-123',
      },
      display: 'Aspirin 100mg',
      dosage: 100,
      dosageUnit: null,
      frequency: null,
      instruction: null,
      route: null,
      duration: 7,
      durationUnit: null,
      isSTAT: false,
      isPRN: false,
      dispenseQuantity: 14,
      dispenseUnit: null,
      errors: {},
      hasBeenValidated: true,
    };

    describe('Bundle Entry Creation', () => {
      it('should create bundle entries with correct structure', () => {
        const result = createMedicationRequestEntries({
          selectedMedications: [mockMedicationEntry],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        expect(result[0].fullUrl).toBe(`urn:uuid:${mockUUID}`);
        expect(result[0].resource?.resourceType).toBe('MedicationRequest');
        expect(result[0].request).toEqual({
          method: 'POST',
          url: 'MedicationRequest',
        });
      });

      it('should create multiple bundle entries for multiple medications', () => {
        const medications = [
          mockMedicationEntry,
          { ...mockMedicationEntry, id: 'med-456' },
          { ...mockMedicationEntry, id: 'med-789' },
        ];

        const result = createMedicationRequestEntries({
          selectedMedications: medications,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(3);
        result.forEach((entry) => {
          expect(entry.resource?.resourceType).toBe('MedicationRequest');
          expect(entry.request?.method).toBe('POST');
        });
      });

      it('should return empty array for empty medications list', () => {
        const result = createMedicationRequestEntries({
          selectedMedications: [],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toEqual([]);
      });
    });

    describe('Parameter Validation', () => {
      it('should throw error for null selectedMedications', () => {
        expect(() =>
          createMedicationRequestEntries({
            selectedMedications: null as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });

      it('should throw error for non-array selectedMedications', () => {
        expect(() =>
          createMedicationRequestEntries({
            selectedMedications: 'not-an-array' as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });

      it('should throw error for missing encounterSubject', () => {
        expect(() =>
          createMedicationRequestEntries({
            selectedMedications: [mockMedicationEntry],

            encounterSubject: null as any,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT);
      });

      it('should throw error for encounterSubject without reference', () => {
        expect(() =>
          createMedicationRequestEntries({
            selectedMedications: [mockMedicationEntry],
            encounterSubject: {} as Reference,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT);
      });

      it('should throw error for missing encounterReference', () => {
        expect(() =>
          createMedicationRequestEntries({
            selectedMedications: [mockMedicationEntry],
            encounterSubject: mockEncounterSubject,
            encounterReference: '',
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_REFERENCE);
      });

      it('should throw error for missing practitionerUUID', () => {
        expect(() =>
          createMedicationRequestEntries({
            selectedMedications: [mockMedicationEntry],
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: '',
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_PRACTITIONER);
      });
    });

    describe('Reference Creation', () => {
      it('should create proper references for encounter and practitioner', () => {
        const result = createMedicationRequestEntries({
          selectedMedications: [mockMedicationEntry],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        const medicationRequest = result[0].resource as MedicationRequest;
        expect(medicationRequest.subject).toEqual(mockEncounterSubject);
        expect(medicationRequest.encounter?.reference).toBe(
          mockEncounterReference,
        );
        expect(medicationRequest.requester?.reference).toBe(
          `Practitioner/${mockPractitionerUUID}`,
        );
      });
    });

    describe('UUID Generation', () => {
      it('should generate unique UUIDs for each medication entry', () => {
        const medications = [
          mockMedicationEntry,
          { ...mockMedicationEntry, id: 'med-456' },
        ];

        // Mock different UUIDs for each call
        let callCount = 0;
        const uuids = ['uuid-1', 'uuid-2'];
        (global.crypto.randomUUID as jest.Mock).mockImplementation(
          () => uuids[callCount++],
        );

        const result = createMedicationRequestEntries({
          selectedMedications: medications,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result[0].fullUrl).toBe('urn:uuid:uuid-1');
        expect(result[1].fullUrl).toBe('urn:uuid:uuid-2');

        // Reset mock
        (global.crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);
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
