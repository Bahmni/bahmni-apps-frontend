import { Reference } from 'fhir/r4';
import { createCodeableConcept, createCoding } from '../codeableConceptCreator';
import { createServiceRequestResource } from '../serviceRequestResourceCreator';

// Mock the dependencies
jest.mock('../codeableConceptCreator');

describe('serviceRequestResourceCreator', () => {
  const mockCreateCodeableConcept =
    createCodeableConcept as jest.MockedFunction<typeof createCodeableConcept>;
  const mockCreateCoding = createCoding as jest.MockedFunction<
    typeof createCoding
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockCreateCoding.mockImplementation((code, system?, display?) => ({
      code,
      ...(system && { system }),
      ...(display && { display }),
    }));

    mockCreateCodeableConcept.mockImplementation((coding, text?) => ({
      coding,
      ...(text && { text }),
    }));
  });

  describe('createServiceRequestResource', () => {
    // Common test data
    const serviceConceptUUID = '123e4567-e89b-12d3-a456-426614174000';
    const subjectReference: Reference = {
      reference: 'Patient/patient-123',
      type: 'Patient',
    };
    const encounterReference: Reference = {
      reference: 'Encounter/encounter-456',
      type: 'Encounter',
    };
    const requesterReference: Reference = {
      reference: 'Practitioner/practitioner-789',
      type: 'Practitioner',
    };

    it('should create a ServiceRequest resource with routine priority', () => {
      const priority = 'routine' as const;
      const mockServiceCodeableConcept = {
        coding: [{ code: serviceConceptUUID }],
      };

      mockCreateCodeableConcept.mockReturnValueOnce(mockServiceCodeableConcept);

      const result = createServiceRequestResource(
        serviceConceptUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        priority,
      );

      expect(result).toEqual({
        resourceType: 'ServiceRequest',
        status: 'active',
        intent: 'order',
        priority: 'routine',
        code: mockServiceCodeableConcept,
        subject: subjectReference,
        encounter: encounterReference,
        requester: requesterReference,
      });

      // Verify mock calls
      expect(mockCreateCoding).toHaveBeenCalledTimes(1);
      expect(mockCreateCoding).toHaveBeenCalledWith(serviceConceptUUID);

      expect(mockCreateCodeableConcept).toHaveBeenCalledTimes(1);
      expect(mockCreateCodeableConcept).toHaveBeenCalledWith([
        mockCreateCoding.mock.results[0].value,
      ]);
    });

    it('should create a ServiceRequest resource with stat priority', () => {
      const priority = 'stat' as const;
      const mockServiceCodeableConcept = {
        coding: [{ code: serviceConceptUUID }],
      };

      mockCreateCodeableConcept.mockReturnValueOnce(mockServiceCodeableConcept);

      const result = createServiceRequestResource(
        serviceConceptUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        priority,
      );

      expect(result.priority).toBe('stat');
    });

    it('should handle minimal Reference objects without type property', () => {
      const minimalSubjectRef: Reference = { reference: 'Patient/123' };
      const minimalEncounterRef: Reference = { reference: 'Encounter/456' };
      const minimalRequesterRef: Reference = { reference: 'Practitioner/789' };

      const result = createServiceRequestResource(
        serviceConceptUUID,
        minimalSubjectRef,
        minimalEncounterRef,
        minimalRequesterRef,
        'routine',
      );

      expect(result.subject).toEqual(minimalSubjectRef);
      expect(result.encounter).toEqual(minimalEncounterRef);
      expect(result.requester).toEqual(minimalRequesterRef);
    });

    it('should always set resourceType to "ServiceRequest"', () => {
      const result = createServiceRequestResource(
        serviceConceptUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        'routine',
      );

      expect(result.resourceType).toBe('ServiceRequest');
    });

    it('should always set status to "active"', () => {
      const result = createServiceRequestResource(
        serviceConceptUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        'routine',
      );

      expect(result.status).toBe('active');
    });

    it('should always set intent to "order"', () => {
      const result = createServiceRequestResource(
        serviceConceptUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        'routine',
      );

      expect(result.intent).toBe('order');
    });

    it('should handle empty UUID string', () => {
      const emptyUUID = '';

      const result = createServiceRequestResource(
        emptyUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        'routine',
      );

      expect(mockCreateCoding).toHaveBeenCalledWith(emptyUUID);
      expect(result).toBeDefined();
    });

    it('should handle Reference objects with additional properties', () => {
      const extendedSubjectRef: Reference = {
        reference: 'Patient/123',
        type: 'Patient',
        display: 'John Doe',
      };
      const extendedEncounterRef: Reference = {
        reference: 'Encounter/456',
        type: 'Encounter',
        identifier: {
          system: 'http://example.org',
          value: 'ENC-456',
        },
      };

      const result = createServiceRequestResource(
        serviceConceptUUID,
        extendedSubjectRef,
        extendedEncounterRef,
        requesterReference,
        'stat',
      );

      expect(result.subject).toEqual(extendedSubjectRef);
      expect(result.encounter).toEqual(extendedEncounterRef);
    });

    it('should create proper structure for FHIR ServiceRequest resource', () => {
      const result = createServiceRequestResource(
        serviceConceptUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        'routine',
      );

      expect(result).toHaveProperty('resourceType');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('priority');
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('encounter');
      expect(result).toHaveProperty('requester');

      // Verify no extra properties
      const expectedKeys = [
        'resourceType',
        'status',
        'intent',
        'priority',
        'code',
        'subject',
        'encounter',
        'requester',
      ];
      expect(Object.keys(result).sort()).toEqual(expectedKeys.sort());
    });

    it('should create consistent code property using helper functions', () => {
      const mockCoding = { code: serviceConceptUUID };
      const mockCodeableConcept = { coding: [mockCoding] };

      mockCreateCoding.mockReturnValueOnce(mockCoding);
      mockCreateCodeableConcept.mockReturnValueOnce(mockCodeableConcept);

      const result = createServiceRequestResource(
        serviceConceptUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        'routine',
      );

      expect(result.code).toEqual(mockCodeableConcept);
      expect(mockCreateCoding).toHaveBeenCalledWith(serviceConceptUUID);
      expect(mockCreateCodeableConcept).toHaveBeenCalledWith([mockCoding]);
    });

    it('should include note field when note is provided', () => {
      const note = 'Patient requires fasting before test';

      const result = createServiceRequestResource(
        serviceConceptUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        'routine',
        note,
      );

      expect(result.note).toBeDefined();
      expect(result.note).toHaveLength(1);
      expect(result.note![0].text).toBe(note);
    });

    it('should not include note field when note is not provided', () => {
      const result = createServiceRequestResource(
        serviceConceptUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        'routine',
      );

      expect(result.note).toBeUndefined();
    });

    it('should not include note field when note is empty string', () => {
      const result = createServiceRequestResource(
        serviceConceptUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        'routine',
        '',
      );

      expect(result.note).toBeUndefined();
    });

    it('should not include note field when note is only whitespace', () => {
      const result = createServiceRequestResource(
        serviceConceptUUID,
        subjectReference,
        encounterReference,
        requesterReference,
        'routine',
        '   ',
      );

      expect(result.note).toBeUndefined();
    });
  });
});
