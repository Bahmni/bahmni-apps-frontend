import { createEncounterDiagnosisResource } from '../conditionResourceCreator';
import { createCodeableConcept, createCoding } from '../codeableConceptCreator';
import { HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM } from '@/constants/fhir';
import { Reference } from 'fhir/r4';

// Mock the dependencies
jest.mock('../codeableConceptCreator');

describe('conditionResourceCreator', () => {
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

  describe('createEncounterDiagnosisResource', () => {
    // Common test data
    const diagnosisConceptUUID = '123e4567-e89b-12d3-a456-426614174000';
    const subjectReference: Reference = {
      reference: 'Patient/patient-123',
      type: 'Patient',
    };
    const encounterReference: Reference = {
      reference: 'Encounter/encounter-456',
      type: 'Encounter',
    };
    const recorderReference: Reference = {
      reference: 'Practitioner/practitioner-789',
      type: 'Practitioner',
    };
    const recordedDate = new Date('2024-01-15T10:30:00Z');

    it('should create a Condition resource with provisional diagnosis', () => {
      // Arrange
      const diagnosisCertainty = 'provisional' as const;
      const mockDiagnosisCodeableConcept = {
        coding: [{ code: diagnosisConceptUUID }],
      };
      const mockVerificationStatusCodeableConcept = {
        coding: [
          {
            code: 'provisional',
            system: HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM,
          },
        ],
      };

      mockCreateCodeableConcept
        .mockReturnValueOnce(mockDiagnosisCodeableConcept)
        .mockReturnValueOnce(mockVerificationStatusCodeableConcept);

      // Act
      const result = createEncounterDiagnosisResource(
        diagnosisConceptUUID,
        diagnosisCertainty,
        subjectReference,
        encounterReference,
        recorderReference,
        recordedDate,
      );

      // Assert
      expect(result).toEqual({
        resourceType: 'Condition',
        subject: subjectReference,
        category: [
          {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/condition-category',
                code: 'encounter-diagnosis',
              },
            ],
          },
        ],
        code: mockDiagnosisCodeableConcept,
        verificationStatus: mockVerificationStatusCodeableConcept,
        encounter: encounterReference,
        recorder: recorderReference,
        recordedDate: '2024-01-15T10:30:00.000Z',
      });

      // Verify mock calls
      expect(mockCreateCoding).toHaveBeenCalledTimes(2);
      expect(mockCreateCoding).toHaveBeenNthCalledWith(1, diagnosisConceptUUID);
      expect(mockCreateCoding).toHaveBeenNthCalledWith(
        2,
        'provisional',
        HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM,
      );

      expect(mockCreateCodeableConcept).toHaveBeenCalledTimes(2);
      expect(mockCreateCodeableConcept).toHaveBeenNthCalledWith(1, [
        mockCreateCoding.mock.results[0].value,
      ]);
      expect(mockCreateCodeableConcept).toHaveBeenNthCalledWith(2, [
        mockCreateCoding.mock.results[1].value,
      ]);
    });

    it('should create a Condition resource with confirmed diagnosis', () => {
      // Arrange
      const diagnosisCertainty = 'confirmed' as const;
      const mockDiagnosisCodeableConcept = {
        coding: [{ code: diagnosisConceptUUID }],
      };
      const mockVerificationStatusCodeableConcept = {
        coding: [
          {
            code: 'confirmed',
            system: HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM,
          },
        ],
      };

      mockCreateCodeableConcept
        .mockReturnValueOnce(mockDiagnosisCodeableConcept)
        .mockReturnValueOnce(mockVerificationStatusCodeableConcept);

      // Act
      const result = createEncounterDiagnosisResource(
        diagnosisConceptUUID,
        diagnosisCertainty,
        subjectReference,
        encounterReference,
        recorderReference,
        recordedDate,
      );

      // Assert
      expect(result.verificationStatus).toEqual(
        mockVerificationStatusCodeableConcept,
      );
      expect(mockCreateCoding).toHaveBeenNthCalledWith(
        2,
        'confirmed',
        HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM,
      );
    });

    it('should handle minimal Reference objects without type property', () => {
      // Arrange
      const minimalSubjectRef: Reference = { reference: 'Patient/123' };
      const minimalEncounterRef: Reference = { reference: 'Encounter/456' };
      const minimalRecorderRef: Reference = { reference: 'Practitioner/789' };

      // Act
      const result = createEncounterDiagnosisResource(
        diagnosisConceptUUID,
        'provisional',
        minimalSubjectRef,
        minimalEncounterRef,
        minimalRecorderRef,
        recordedDate,
      );

      // Assert
      expect(result.subject).toEqual(minimalSubjectRef);
      expect(result.encounter).toEqual(minimalEncounterRef);
      expect(result.recorder).toEqual(minimalRecorderRef);
    });

    it('should handle different date objects and convert to ISO string', () => {
      // Arrange
      const differentDates = [
        new Date('2023-12-25T00:00:00Z'),
        new Date('2024-06-15T23:59:59.999Z'),
        new Date('2024-01-01T12:00:00+05:30'), // With timezone
      ];

      differentDates.forEach((date) => {
        // Act
        const result = createEncounterDiagnosisResource(
          diagnosisConceptUUID,
          'confirmed',
          subjectReference,
          encounterReference,
          recorderReference,
          date,
        );

        // Assert
        expect(result.recordedDate).toBe(date.toISOString());
        expect(typeof result.recordedDate).toBe('string');
        expect(result.recordedDate).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      });
    });

    it('should always set resourceType to "Condition"', () => {
      // Act
      const result = createEncounterDiagnosisResource(
        diagnosisConceptUUID,
        'provisional',
        subjectReference,
        encounterReference,
        recorderReference,
        recordedDate,
      );

      // Assert
      expect(result.resourceType).toBe('Condition');
    });

    it('should always include encounter-diagnosis category', () => {
      // Act
      const result = createEncounterDiagnosisResource(
        diagnosisConceptUUID,
        'confirmed',
        subjectReference,
        encounterReference,
        recorderReference,
        recordedDate,
      );

      // Assert
      expect(result.category).toBeDefined();
      expect(result.category).toHaveLength(1);
      expect(result.category![0].coding).toBeDefined();
      expect(result.category![0].coding).toHaveLength(1);
      expect(result.category![0].coding![0]).toEqual({
        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
        code: 'encounter-diagnosis',
      });
    });

    it('should handle empty UUID string', () => {
      // Arrange
      const emptyUUID = '';

      // Act
      const result = createEncounterDiagnosisResource(
        emptyUUID,
        'provisional',
        subjectReference,
        encounterReference,
        recorderReference,
        recordedDate,
      );

      // Assert
      expect(mockCreateCoding).toHaveBeenCalledWith(emptyUUID);
      expect(result).toBeDefined();
    });

    it('should handle Reference objects with additional properties', () => {
      // Arrange
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

      // Act
      const result = createEncounterDiagnosisResource(
        diagnosisConceptUUID,
        'confirmed',
        extendedSubjectRef,
        extendedEncounterRef,
        recorderReference,
        recordedDate,
      );

      // Assert
      expect(result.subject).toEqual(extendedSubjectRef);
      expect(result.encounter).toEqual(extendedEncounterRef);
    });

    it('should create proper structure for FHIR Condition resource', () => {
      // Act
      const result = createEncounterDiagnosisResource(
        diagnosisConceptUUID,
        'provisional',
        subjectReference,
        encounterReference,
        recorderReference,
        recordedDate,
      );

      // Assert - Verify all required FHIR Condition properties are present
      expect(result).toHaveProperty('resourceType');
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('verificationStatus');
      expect(result).toHaveProperty('encounter');
      expect(result).toHaveProperty('recorder');
      expect(result).toHaveProperty('recordedDate');

      // Verify no extra properties
      const expectedKeys = [
        'resourceType',
        'subject',
        'category',
        'code',
        'verificationStatus',
        'encounter',
        'recorder',
        'recordedDate',
      ];
      expect(Object.keys(result).sort()).toEqual(expectedKeys.sort());
    });
  });
});
