import { HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM } from '@bahmni/services';
import { Reference } from 'fhir/r4';
import { createCodeableConcept, createCoding } from '../codeableConceptCreator';
import {
  createEncounterDiagnosisResource,
  createEncounterConditionResource,
} from '../conditionResourceCreator';

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
        .mockReturnValueOnce({
          coding: [
            {
              code: 'active',
              system:
                'http://terminology.hl7.org/CodeSystem/condition-clinical',
            },
          ],
        })
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
        clinicalStatus: {
          coding: [
            {
              code: 'active',
              system:
                'http://terminology.hl7.org/CodeSystem/condition-clinical',
            },
          ],
        },
        verificationStatus: mockVerificationStatusCodeableConcept,
        encounter: encounterReference,
        recorder: recorderReference,
        recordedDate: '2024-01-15T10:30:00.000Z',
      });

      // Verify mock calls
      expect(mockCreateCoding).toHaveBeenCalledTimes(3);
      expect(mockCreateCoding).toHaveBeenNthCalledWith(1, diagnosisConceptUUID);
      expect(mockCreateCoding).toHaveBeenNthCalledWith(
        2,
        'active',
        'http://terminology.hl7.org/CodeSystem/condition-clinical',
      );
      expect(mockCreateCoding).toHaveBeenNthCalledWith(
        3,
        'provisional',
        HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM,
      );

      expect(mockCreateCodeableConcept).toHaveBeenCalledTimes(3);
      expect(mockCreateCodeableConcept).toHaveBeenNthCalledWith(1, [
        mockCreateCoding.mock.results[0].value,
      ]);
      expect(mockCreateCodeableConcept).toHaveBeenNthCalledWith(2, [
        mockCreateCoding.mock.results[1].value,
      ]);
      expect(mockCreateCodeableConcept).toHaveBeenNthCalledWith(3, [
        mockCreateCoding.mock.results[2].value,
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
        'active',
        'http://terminology.hl7.org/CodeSystem/condition-clinical',
      );
      expect(mockCreateCoding).toHaveBeenNthCalledWith(
        3,
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
        'clinicalStatus',
        'verificationStatus',
        'encounter',
        'recorder',
        'recordedDate',
      ];
      expect(Object.keys(result).sort()).toEqual(expectedKeys.sort());
    });
  });

  describe('createEncounterConditionResource', () => {
    // Common test data
    const conditionConceptUUID = '987e6543-e21a-34d5-b789-654321098765';
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
    const onsetDate = new Date('2024-01-10T08:00:00Z');

    describe('Happy Path Tests', () => {
      it('should create a Condition resource with active clinical status', () => {
        // Arrange
        const clinicalStatus = 'active' as const;
        const mockConditionCodeableConcept = {
          coding: [{ code: conditionConceptUUID }],
        };
        const mockClinicalStatusCodeableConcept = {
          coding: [
            {
              code: 'active',
              system:
                'http://terminology.hl7.org/CodeSystem/condition-clinical',
            },
          ],
        };

        mockCreateCodeableConcept
          .mockReturnValueOnce(mockConditionCodeableConcept)
          .mockReturnValueOnce(mockClinicalStatusCodeableConcept);

        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          onsetDate,
          clinicalStatus,
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
                  code: 'problem-list-item',
                },
              ],
            },
          ],
          code: mockConditionCodeableConcept,
          clinicalStatus: mockClinicalStatusCodeableConcept,
          encounter: encounterReference,
          recorder: recorderReference,
          recordedDate: '2024-01-15T10:30:00.000Z',
          onsetDateTime: '2024-01-10T08:00:00.000Z',
        });

        // Verify mock calls
        expect(mockCreateCoding).toHaveBeenCalledTimes(2);
        expect(mockCreateCoding).toHaveBeenNthCalledWith(
          1,
          conditionConceptUUID,
        );
        expect(mockCreateCoding).toHaveBeenNthCalledWith(
          2,
          'active',
          'http://terminology.hl7.org/CodeSystem/condition-clinical',
        );

        expect(mockCreateCodeableConcept).toHaveBeenCalledTimes(2);
        expect(mockCreateCodeableConcept).toHaveBeenNthCalledWith(1, [
          mockCreateCoding.mock.results[0].value,
        ]);
        expect(mockCreateCodeableConcept).toHaveBeenNthCalledWith(2, [
          mockCreateCoding.mock.results[1].value,
        ]);
      });

      it('should create a Condition resource with inactive clinical status', () => {
        // Arrange
        const clinicalStatus = 'inactive' as const;
        const mockConditionCodeableConcept = {
          coding: [{ code: conditionConceptUUID }],
        };
        const mockClinicalStatusCodeableConcept = {
          coding: [
            {
              code: 'inactive',
              system:
                'http://terminology.hl7.org/CodeSystem/condition-clinical',
            },
          ],
        };

        mockCreateCodeableConcept
          .mockReturnValueOnce(mockConditionCodeableConcept)
          .mockReturnValueOnce(mockClinicalStatusCodeableConcept);

        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          onsetDate,
          clinicalStatus,
        );

        // Assert
        expect(result.clinicalStatus).toEqual(
          mockClinicalStatusCodeableConcept,
        );
        expect(mockCreateCoding).toHaveBeenNthCalledWith(
          2,
          'inactive',
          'http://terminology.hl7.org/CodeSystem/condition-clinical',
        );
      });

      it('should default to active clinical status when not specified', () => {
        // Arrange
        const mockConditionCodeableConcept = {
          coding: [{ code: conditionConceptUUID }],
        };
        const mockClinicalStatusCodeableConcept = {
          coding: [
            {
              code: 'active',
              system:
                'http://terminology.hl7.org/CodeSystem/condition-clinical',
            },
          ],
        };

        mockCreateCodeableConcept
          .mockReturnValueOnce(mockConditionCodeableConcept)
          .mockReturnValueOnce(mockClinicalStatusCodeableConcept);

        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          onsetDate,
        );

        // Assert
        expect(result.clinicalStatus).toEqual(
          mockClinicalStatusCodeableConcept,
        );
        expect(mockCreateCoding).toHaveBeenNthCalledWith(
          2,
          'active',
          'http://terminology.hl7.org/CodeSystem/condition-clinical',
        );
      });

      it('should include onset date when provided', () => {
        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          onsetDate,
          'active',
        );

        // Assert
        expect(result.onsetDateTime).toBe(onsetDate.toISOString());
        expect(result.onsetDateTime).toBe('2024-01-10T08:00:00.000Z');
      });
    });

    describe('FHIR Compliance Tests', () => {
      it('should always set resourceType to "Condition"', () => {
        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          onsetDate,
          'active',
        );

        // Assert
        expect(result.resourceType).toBe('Condition');
      });

      it('should always include problem-list-item category', () => {
        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          onsetDate,
          'active',
        );

        // Assert
        expect(result.category).toBeDefined();
        expect(result.category).toHaveLength(1);
        expect(result.category![0].coding).toBeDefined();
        expect(result.category![0].coding).toHaveLength(1);
        expect(result.category![0].coding![0]).toEqual({
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: 'problem-list-item',
        });
      });

      it('should create proper structure for FHIR Condition resource', () => {
        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          onsetDate,
          'active',
        );

        // Assert - Verify all required FHIR Condition properties are present
        expect(result).toHaveProperty('resourceType');
        expect(result).toHaveProperty('subject');
        expect(result).toHaveProperty('category');
        expect(result).toHaveProperty('code');
        expect(result).toHaveProperty('clinicalStatus');
        expect(result).toHaveProperty('encounter');
        expect(result).toHaveProperty('recorder');
        expect(result).toHaveProperty('recordedDate');
        expect(result).toHaveProperty('onsetDateTime');

        // Verify no extra properties
        const expectedKeys = [
          'resourceType',
          'subject',
          'category',
          'code',
          'clinicalStatus',
          'encounter',
          'recorder',
          'recordedDate',
          'onsetDateTime',
        ];
        expect(Object.keys(result).sort()).toEqual(expectedKeys.sort());
      });

      it('should handle Reference objects with additional properties', () => {
        // Arrange
        const extendedSubjectRef: Reference = {
          reference: 'Patient/123',
          type: 'Patient',
          display: 'Jane Smith',
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
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          extendedSubjectRef,
          extendedEncounterRef,
          recorderReference,
          recordedDate,
          onsetDate,
          'active',
        );

        // Assert
        expect(result.subject).toEqual(extendedSubjectRef);
        expect(result.encounter).toEqual(extendedEncounterRef);
      });
    });

    describe('Date Handling Tests', () => {
      it('should convert recordedDate to ISO string', () => {
        // Arrange
        const testDate = new Date('2024-03-20T14:25:30.123Z');

        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          testDate,
          onsetDate,
          'active',
        );

        // Assert
        expect(result.recordedDate).toBe(testDate.toISOString());
        expect(typeof result.recordedDate).toBe('string');
        expect(result.recordedDate).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      });

      it('should convert onsetDate to ISO string', () => {
        // Arrange
        const testOnsetDate = new Date('2024-01-05T06:15:45.789Z');

        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          testOnsetDate,
          'active',
        );

        // Assert
        expect(result.onsetDateTime).toBe(testOnsetDate.toISOString());
        expect(typeof result.onsetDateTime).toBe('string');
        expect(result.onsetDateTime).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      });

      it('should handle different date formats correctly', () => {
        // Arrange
        const differentDates = [
          new Date('2023-12-25T00:00:00Z'),
          new Date('2024-06-15T23:59:59.999Z'),
          new Date('2024-01-01T12:00:00+05:30'), // With timezone
        ];

        differentDates.forEach((date) => {
          // Act
          const result = createEncounterConditionResource(
            conditionConceptUUID,
            subjectReference,
            encounterReference,
            recorderReference,
            date,
            onsetDate,
            'active',
          );

          // Assert
          expect(result.recordedDate).toBe(date.toISOString());
          expect(result.onsetDateTime).toBe(onsetDate.toISOString());
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle minimal Reference objects without type property', () => {
        // Arrange
        const minimalSubjectRef: Reference = { reference: 'Patient/123' };
        const minimalEncounterRef: Reference = { reference: 'Encounter/456' };
        const minimalRecorderRef: Reference = { reference: 'Practitioner/789' };

        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          minimalSubjectRef,
          minimalEncounterRef,
          minimalRecorderRef,
          recordedDate,
          onsetDate,
          'active',
        );

        // Assert
        expect(result.subject).toEqual(minimalSubjectRef);
        expect(result.encounter).toEqual(minimalEncounterRef);
        expect(result.recorder).toEqual(minimalRecorderRef);
      });

      it('should handle empty UUID string', () => {
        // Arrange
        const emptyUUID = '';

        // Act
        const result = createEncounterConditionResource(
          emptyUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          onsetDate,
          'active',
        );

        // Assert
        expect(mockCreateCoding).toHaveBeenCalledWith(emptyUUID);
        expect(result).toBeDefined();
      });

      it('should handle onset date same as recorded date', () => {
        // Arrange
        const sameDate = new Date('2024-01-15T10:30:00Z');

        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          sameDate,
          sameDate,
          'active',
        );

        // Assert
        expect(result.recordedDate).toBe(result.onsetDateTime);
        expect(result.recordedDate).toBe('2024-01-15T10:30:00.000Z');
      });

      it('should handle onset date after recorded date', () => {
        // Arrange
        const laterOnsetDate = new Date('2024-01-20T12:00:00Z');

        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          laterOnsetDate,
          'active',
        );

        // Assert
        expect(result.onsetDateTime).toBe('2024-01-20T12:00:00.000Z');
        expect(result.recordedDate).toBe('2024-01-15T10:30:00.000Z');
      });
    });

    describe('Integration Tests', () => {
      it('should work with createCodeableConcept and createCoding utilities', () => {
        // Arrange
        const expectedConditionCoding = { code: conditionConceptUUID };
        const expectedStatusCoding = {
          code: 'active',
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        };

        mockCreateCoding
          .mockReturnValueOnce(expectedConditionCoding)
          .mockReturnValueOnce(expectedStatusCoding);

        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          onsetDate,
          'active',
        );

        // Assert
        expect(mockCreateCoding).toHaveBeenCalledWith(conditionConceptUUID);
        expect(mockCreateCoding).toHaveBeenCalledWith(
          'active',
          'http://terminology.hl7.org/CodeSystem/condition-clinical',
        );
        expect(mockCreateCodeableConcept).toHaveBeenCalledWith([
          expectedConditionCoding,
        ]);
        expect(mockCreateCodeableConcept).toHaveBeenCalledWith([
          expectedStatusCoding,
        ]);
        expect(result).toBeDefined();
      });

      it('should create valid FHIR R4 Condition resource', () => {
        // Act
        const result = createEncounterConditionResource(
          conditionConceptUUID,
          subjectReference,
          encounterReference,
          recorderReference,
          recordedDate,
          onsetDate,
          'active',
        );

        // Assert - Validate FHIR R4 structure
        expect(result.resourceType).toBe('Condition');
        expect(result.subject).toBeDefined();
        expect(result.code).toBeDefined();
        expect(result.clinicalStatus).toBeDefined();
        expect(result.category).toBeDefined();
        expect(result.encounter).toBeDefined();
        expect(result.recorder).toBeDefined();
        expect(result.recordedDate).toBeDefined();
        expect(result.onsetDateTime).toBeDefined();

        // Validate date formats
        expect(result.recordedDate).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
        expect(result.onsetDateTime).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      });
    });
  });
});
