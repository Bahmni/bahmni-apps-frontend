import { Reference } from 'fhir/r4';
import {
  createMedicationRequestResource,
  createMedicationRequestResources,
} from '../medicationRequestResourceCreator';
import { MedicationInputEntry, DurationUnitOption } from '@types/medication';
import { Frequency } from '@types/medicationConfig';
import { Concept } from '@types/encounterConcepts';
import * as referenceCreator from '../referenceCreator';
import * as codeableConceptCreator from '../codeableConceptCreator';

// Mock the dependencies
jest.mock('../referenceCreator');
jest.mock('../codeableConceptCreator');

describe('medicationRequestResourceCreator', () => {
  // Mock data
  const mockConcept: Concept = {
    uuid: 'concept-uuid',
    name: 'Test Concept',
  };

  const mockFrequency: Frequency = {
    uuid: 'frequency-uuid',
    name: 'Twice daily',
    frequencyPerDay: 2,
  };

  const mockDurationUnit: DurationUnitOption = {
    code: 'd',
    display: 'days',
    daysMultiplier: 1,
  };

  const mockMedicationEntry: MedicationInputEntry = {
    id: 'med-123',
    medication: {
      resourceType: 'Medication',
      id: 'med-123',
    },
    display: 'Aspirin 100mg',
    dosage: 100,
    dosageUnit: mockConcept,
    frequency: mockFrequency,
    instruction: mockConcept,
    route: mockConcept,
    duration: 7,
    durationUnit: mockDurationUnit,
    isSTAT: false,
    isPRN: false,
    startDate: new Date('2024-01-01T10:00:00Z'),
    dispenseQuantity: 14,
    dispenseUnit: mockConcept,
    errors: {},
    hasBeenValidated: true,
  };

  const mockSubjectReference: Reference = {
    reference: 'Patient/patient-123',
  };

  const mockEncounterReference: Reference = {
    reference: 'Encounter/encounter-123',
  };

  const mockRequesterReference: Reference = {
    reference: 'Practitioner/practitioner-123',
    type: 'Practitioner',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (referenceCreator.createMedicationReference as jest.Mock).mockReturnValue({
      reference: 'Medication/med-123',
      type: 'Medication',
    });

    (codeableConceptCreator.createCodeableConcept as jest.Mock).mockImplementation((coding) => ({
      coding,
    }));

    (codeableConceptCreator.createCoding as jest.Mock).mockImplementation((code) => ({
      code,
    }));
  });

  describe('createMedicationRequestResource', () => {
    it('should create a complete MedicationRequest resource with all fields', () => {
      // Act
      const result = createMedicationRequestResource(
        mockMedicationEntry,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      expect(result).toMatchObject({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        medicationReference: {
          reference: 'Medication/med-123',
          type: 'Medication',
        },
        subject: mockSubjectReference,
        encounter: mockEncounterReference,
        requester: mockRequesterReference,
      });

      // Verify dosage instructions
      expect(result.dosageInstruction).toHaveLength(1);
      const dosage = result.dosageInstruction![0];
      
      // Check dosing instruction text
      const dosingInstruction = JSON.parse(dosage.text!);
      expect(dosingInstruction.instructions).toBe('Test Concept');
      
      // Check timing
      expect(dosage.timing).toBeDefined();
      expect(dosage.timing!.event).toEqual(['2024-01-01T10:00:00.000Z']);
      expect(dosage.timing!.repeat).toEqual({
        duration: 7,
        durationUnit: 'd',
      });
      
      // Check other dosage fields
      expect(dosage.asNeededBoolean).toBe(false);
      expect(dosage.route).toBeDefined();
      expect(dosage.doseAndRate).toEqual([{
        doseQuantity: {
          value: 100,
          code: 'concept-uuid',
        }
      }]);

      // Verify dispense request
      expect(result.dispenseRequest).toEqual({
        numberOfRepeatsAllowed: 0,
        quantity: {
          value: 14,
          code: 'concept-uuid',
        }
      });

      // Verify mocks were called correctly
      expect(referenceCreator.createMedicationReference).toHaveBeenCalledWith('med-123');
      expect(codeableConceptCreator.createCoding).toHaveBeenCalledWith('concept-uuid');
      expect(codeableConceptCreator.createCoding).toHaveBeenCalledWith('frequency-uuid');
    });

    it('should create MedicationRequest with PRN set to true', () => {
      // Arrange
      const prnEntry = {
        ...mockMedicationEntry,
        isPRN: true,
      };

      // Act
      const result = createMedicationRequestResource(
        prnEntry,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      expect(result.dosageInstruction![0].asNeededBoolean).toBe(true);
    });

    it('should create MedicationRequest without optional fields', () => {
      // Arrange
      const minimalEntry: MedicationInputEntry = {
        ...mockMedicationEntry,
        dosageUnit: null,
        frequency: null,
        instruction: null,
        route: null,
        durationUnit: null,
        startDate: undefined,
        dispenseUnit: null,
      };

      // Act
      const result = createMedicationRequestResource(
        minimalEntry,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      expect(result.dosageInstruction).toHaveLength(1);
      const dosage = result.dosageInstruction![0];
      
      // Check that optional fields are not present
      expect(dosage.timing).toBeUndefined();
      expect(dosage.route).toBeUndefined();
      expect(dosage.doseAndRate).toBeUndefined();
      
      // Dosing instruction should only have empty object
      const dosingInstruction = JSON.parse(dosage.text!);
      expect(dosingInstruction).toEqual({});
    });

    it('should handle medication entry without instruction', () => {
      // Arrange
      const entryWithoutInstruction = {
        ...mockMedicationEntry,
        instruction: null,
      };

      // Act
      const result = createMedicationRequestResource(
        entryWithoutInstruction,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      const dosingInstruction = JSON.parse(result.dosageInstruction![0].text!);
      expect(dosingInstruction).toEqual({});
    });

    it('should handle medication entry without dosage', () => {
      // Arrange
      const entryWithoutDosage = {
        ...mockMedicationEntry,
        dosage: 0,
      };

      // Act
      const result = createMedicationRequestResource(
        entryWithoutDosage,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      expect(result.dosageInstruction![0].doseAndRate).toBeUndefined();
    });

    it('should create timing without duration when duration is not provided', () => {
      // Arrange
      const entryWithoutDuration = {
        ...mockMedicationEntry,
        duration: 0,
      };

      // Act
      const result = createMedicationRequestResource(
        entryWithoutDuration,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      const timing = result.dosageInstruction![0].timing;
      expect(timing).toBeDefined();
      expect(timing!.repeat).toBeUndefined();
      expect(timing!.event).toEqual(['2024-01-01T10:00:00.000Z']);
      expect(timing!.code).toBeDefined();
    });

    it('should create timing without start date when not provided', () => {
      // Arrange
      const entryWithoutStartDate = {
        ...mockMedicationEntry,
        startDate: undefined,
      };

      // Act
      const result = createMedicationRequestResource(
        entryWithoutStartDate,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      const timing = result.dosageInstruction![0].timing;
      expect(timing).toBeDefined();
      expect(timing!.event).toBeUndefined();
      expect(timing!.repeat).toEqual({
        duration: 7,
        durationUnit: 'd',
      });
    });

    it('should handle different duration units correctly', () => {
      // Arrange
      const weekDurationUnit: DurationUnitOption = {
        code: 'wk',
        display: 'weeks',
        daysMultiplier: 7,
      };
      
      const entryWithWeeks = {
        ...mockMedicationEntry,
        duration: 2,
        durationUnit: weekDurationUnit,
      };

      // Act
      const result = createMedicationRequestResource(
        entryWithWeeks,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      expect(result.dosageInstruction![0].timing!.repeat).toEqual({
        duration: 2,
        durationUnit: 'wk',
      });
    });

    it('should handle dispense request with zero quantity', () => {
      // Arrange
      const entryWithZeroDispense = {
        ...mockMedicationEntry,
        dispenseQuantity: 0,
      };

      // Act
      const result = createMedicationRequestResource(
        entryWithZeroDispense,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      expect(result.dispenseRequest).toEqual({
        numberOfRepeatsAllowed: 0,
        quantity: {
          value: 0,
          code: 'concept-uuid',
        }
      });
    });
  });

  describe('createMedicationRequestResources', () => {
    it('should create multiple MedicationRequest resources', () => {
      // Arrange
      const medicationEntries = [
        mockMedicationEntry,
        {
          ...mockMedicationEntry,
          id: 'med-456',
          display: 'Ibuprofen 200mg',
        },
        {
          ...mockMedicationEntry,
          id: 'med-789',
          display: 'Paracetamol 500mg',
        },
      ];

      // Act
      const results = createMedicationRequestResources(
        medicationEntries,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0]).toMatchObject({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
      });
      expect(results[1]).toMatchObject({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
      });
      expect(results[2]).toMatchObject({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
      });

      // Verify createMedicationReference was called for each entry
      expect(referenceCreator.createMedicationReference).toHaveBeenCalledTimes(3);
      expect(referenceCreator.createMedicationReference).toHaveBeenCalledWith('med-123');
      expect(referenceCreator.createMedicationReference).toHaveBeenCalledWith('med-456');
      expect(referenceCreator.createMedicationReference).toHaveBeenCalledWith('med-789');
    });

    it('should handle empty array of medication entries', () => {
      // Act
      const results = createMedicationRequestResources(
        [],
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      expect(results).toEqual([]);
    });

    it('should handle single medication entry', () => {
      // Act
      const results = createMedicationRequestResources(
        [mockMedicationEntry],
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        medicationReference: {
          reference: 'Medication/med-123',
          type: 'Medication',
        },
      });
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle medication entry with all null optional fields', () => {
      // Arrange
      const nullFieldsEntry: MedicationInputEntry = {
        id: 'med-null',
        medication: {
          resourceType: 'Medication',
          id: 'med-null',
        },
        display: 'Test Medication',
        dosage: 0,
        dosageUnit: null,
        frequency: null,
        instruction: null,
        route: null,
        duration: 0,
        durationUnit: null,
        isSTAT: false,
        isPRN: false,
        dispenseQuantity: 0,
        dispenseUnit: null,
        errors: {},
        hasBeenValidated: false,
      };

      // Act
      const result = createMedicationRequestResource(
        nullFieldsEntry,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      expect(result).toMatchObject({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
      });
      expect(result.dosageInstruction![0].timing).toBeUndefined();
      expect(result.dosageInstruction![0].route).toBeUndefined();
      expect(result.dosageInstruction![0].doseAndRate).toBeUndefined();
    });

    it('should preserve timezone information in start date', () => {
      // Arrange
      const dateWithTimezone = new Date('2024-06-15T14:30:00+05:30');
      const entryWithTimezone = {
        ...mockMedicationEntry,
        startDate: dateWithTimezone,
      };

      // Act
      const result = createMedicationRequestResource(
        entryWithTimezone,
        mockSubjectReference,
        mockEncounterReference,
        mockRequesterReference
      );

      // Assert
      const timing = result.dosageInstruction![0].timing;
      expect(timing!.event![0]).toBe(dateWithTimezone.toISOString());
    });
  });
});