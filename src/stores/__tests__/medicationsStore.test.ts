import { act, renderHook } from '@testing-library/react';
import { useMedicationStore } from '../medicationsStore';
import { Medication } from 'fhir/r4';
import { Concept } from '@types/encounterConcepts';
import { Frequency } from '@types/medicationConfig';
import { DurationUnitOption } from '@types/medication';

describe('useMedicationStore', () => {
  const mockMedication: Medication = {
    resourceType: 'Medication',
    id: 'med-123',
    code: {
      coding: [
        {
          system: 'http://example.com',
          code: '123',
          display: 'Test Medication',
        },
      ],
    },
  };

  const mockConcept: Concept = {
    name: 'Test Concept',
    uuid: 'concept-123',
  };

  const mockFrequency: Frequency = {
    name: 'Twice daily',
    uuid: 'freq-123',
    frequencyPerDay: 2,
  };

  const mockDurationUnit: DurationUnitOption = {
    code: 'd',
    display: 'Days',
    daysMultiplier: 1,
  };

  beforeEach(() => {
    const { result } = renderHook(() => useMedicationStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('addMedication', () => {
    it('should add a new medication with default values', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });

      expect(result.current.selectedMedications).toHaveLength(1);
      const addedMedication = result.current.selectedMedications[0];

      expect(addedMedication).toMatchObject({
        id: 'med-123',
        display: 'Test Medication',
        medication: mockMedication,
        dosage: 0,
        dosageUnit: null,
        frequency: null,
        route: null,
        duration: 0,
        durationUnit: null,
        isSTAT: false,
        isPRN: false,
        instruction: null,
        errors: {},
        hasBeenValidated: false,
        dispenseQuantity: 0,
        dispenseUnit: null,
      });
      expect(addedMedication.startDate).toBeInstanceOf(Date);
    });

    it('should add multiple medications in correct order (newest first)', () => {
      const { result } = renderHook(() => useMedicationStore());
      const medication2 = { ...mockMedication, id: 'med-456' };

      act(() => {
        result.current.addMedication(mockMedication, 'Medication 1');
        result.current.addMedication(medication2, 'Medication 2');
      });

      expect(result.current.selectedMedications).toHaveLength(2);
      expect(result.current.selectedMedications[0].id).toBe('med-456');
      expect(result.current.selectedMedications[1].id).toBe('med-123');
    });
  });

  describe('removeMedication', () => {
    it('should remove medication by id', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.removeMedication('med-123');
      });

      expect(result.current.selectedMedications).toHaveLength(0);
    });

    it('should not affect other medications when removing one', () => {
      const { result } = renderHook(() => useMedicationStore());
      const medication2 = { ...mockMedication, id: 'med-456' };

      act(() => {
        result.current.addMedication(mockMedication, 'Medication 1');
        result.current.addMedication(medication2, 'Medication 2');
        result.current.removeMedication('med-123');
      });

      expect(result.current.selectedMedications).toHaveLength(1);
      expect(result.current.selectedMedications[0].id).toBe('med-456');
    });

    it('should handle removing non-existent medication gracefully', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.removeMedication('non-existent-id');
      });

      expect(result.current.selectedMedications).toHaveLength(1);
    });
  });

  describe('updateDosage', () => {
    it('should update dosage for specific medication', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDosage('med-123', 100);
      });

      expect(result.current.selectedMedications[0].dosage).toBe(100);
    });

    it('should clear dosage error when valid dosage is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateDosage('med-123', 50);
      });

      expect(
        result.current.selectedMedications[0].errors.dosage,
      ).toBeUndefined();
    });

    it('should not clear dosage error when dosage is 0 or negative', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateDosage('med-123', 0);
      });

      expect(result.current.selectedMedications[0].errors.dosage).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });

    it('should handle negative dosage values', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDosage('med-123', -10);
      });

      expect(result.current.selectedMedications[0].dosage).toBe(-10);
    });
  });

  describe('updateDosageUnit', () => {
    it('should update dosage unit', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDosageUnit('med-123', mockConcept);
      });

      expect(result.current.selectedMedications[0].dosageUnit).toEqual(
        mockConcept,
      );
    });

    it('should clear dosageUnit error when valid unit is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateDosageUnit('med-123', mockConcept);
      });

      expect(
        result.current.selectedMedications[0].errors.dosageUnit,
      ).toBeUndefined();
    });
  });

  describe('updateFrequency', () => {
    it('should update frequency', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateFrequency('med-123', mockFrequency);
      });

      expect(result.current.selectedMedications[0].frequency).toEqual(
        mockFrequency,
      );
    });

    it('should handle null frequency', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateFrequency('med-123', mockFrequency);
        result.current.updateFrequency('med-123', null);
      });

      expect(result.current.selectedMedications[0].frequency).toBeNull();
    });

    it('should clear frequency error when valid frequency is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateFrequency('med-123', mockFrequency);
      });

      expect(
        result.current.selectedMedications[0].errors.frequency,
      ).toBeUndefined();
    });
  });

  describe('updateRoute', () => {
    it('should update route', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateRoute('med-123', mockConcept);
      });

      expect(result.current.selectedMedications[0].route).toEqual(mockConcept);
    });

    it('should clear route error when valid route is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateRoute('med-123', mockConcept);
      });

      expect(
        result.current.selectedMedications[0].errors.route,
      ).toBeUndefined();
    });
  });

  describe('updateDuration', () => {
    it('should update duration', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDuration('med-123', 7);
      });

      expect(result.current.selectedMedications[0].duration).toBe(7);
    });

    it('should clear duration error when valid duration is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateDuration('med-123', 5);
      });

      expect(
        result.current.selectedMedications[0].errors.duration,
      ).toBeUndefined();
    });

    it('should not clear duration error when duration is 0 or negative', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateDuration('med-123', 0);
      });

      expect(result.current.selectedMedications[0].errors.duration).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });
  });

  describe('updateDurationUnit', () => {
    it('should update duration unit', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDurationUnit('med-123', mockDurationUnit);
      });

      expect(result.current.selectedMedications[0].durationUnit).toEqual(
        mockDurationUnit,
      );
    });

    it('should handle null duration unit', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDurationUnit('med-123', mockDurationUnit);
        result.current.updateDurationUnit('med-123', null);
      });

      expect(result.current.selectedMedications[0].durationUnit).toBeNull();
    });

    it('should clear durationUnit error when set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateDurationUnit('med-123', mockDurationUnit);
      });

      expect(
        result.current.selectedMedications[0].errors.durationUnit,
      ).toBeUndefined();
    });
  });

  describe('updateInstruction', () => {
    it('should update instruction', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateInstruction('med-123', mockConcept);
      });

      expect(result.current.selectedMedications[0].instruction).toEqual(
        mockConcept,
      );
    });
  });

  describe('updateisPRN', () => {
    it('should update isPRN flag', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateisPRN('med-123', true);
      });

      expect(result.current.selectedMedications[0].isPRN).toBe(true);
    });

    it('should toggle isPRN flag', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateisPRN('med-123', true);
        result.current.updateisPRN('med-123', false);
      });

      expect(result.current.selectedMedications[0].isPRN).toBe(false);
    });
  });

  describe('updateisSTAT', () => {
    it('should update isSTAT flag', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateisSTAT('med-123', true);
      });

      expect(result.current.selectedMedications[0].isSTAT).toBe(true);
    });

    it('should clear duration errors when isSTAT is set to true after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateisSTAT('med-123', true);
      });

      expect(
        result.current.selectedMedications[0].errors.duration,
      ).toBeUndefined();
      expect(
        result.current.selectedMedications[0].errors.durationUnit,
      ).toBeUndefined();
    });

    it('should not clear duration errors when isSTAT is set to false', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateisSTAT('med-123', false);
      });

      expect(result.current.selectedMedications[0].errors.duration).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });
  });

  describe('updateStartDate', () => {
    it('should update start date', () => {
      const { result } = renderHook(() => useMedicationStore());
      const newDate = new Date('2024-01-15');

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateStartDate('med-123', newDate);
      });

      expect(result.current.selectedMedications[0].startDate).toEqual(newDate);
    });
  });

  describe('updateDispenseQuantity', () => {
    it('should update dispense quantity', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDispenseQuantity('med-123', 30);
      });

      expect(result.current.selectedMedications[0].dispenseQuantity).toBe(30);
    });

    it('should clear dispenseQuantity error when valid quantity is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateDispenseQuantity('med-123', 10);
      });

      expect(
        result.current.selectedMedications[0].errors.dispenseQuantity,
      ).toBeUndefined();
    });

    it('should clear error even when quantity is 0', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateDispenseQuantity('med-123', 0);
      });

      expect(
        result.current.selectedMedications[0].errors.dispenseQuantity,
      ).toBeUndefined();
    });

    it('should handle negative quantities', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDispenseQuantity('med-123', -5);
      });

      expect(result.current.selectedMedications[0].dispenseQuantity).toBe(-5);
    });
  });

  describe('updateDispenseUnit', () => {
    it('should update dispense unit', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDispenseUnit('med-123', mockConcept);
      });

      expect(result.current.selectedMedications[0].dispenseUnit).toEqual(
        mockConcept,
      );
    });

    it('should clear dispenseUnit error when valid unit is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.validateAllMedications();
        result.current.updateDispenseUnit('med-123', mockConcept);
      });

      expect(
        result.current.selectedMedications[0].errors.dispenseUnit,
      ).toBeUndefined();
    });
  });

  describe('validateAllMedications', () => {
    it('should validate all required fields and return false when invalid', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(false);
      const errors = result.current.selectedMedications[0].errors;
      expect(errors.dosage).toBe('INPUT_VALUE_REQUIRED');
      expect(errors.dosageUnit).toBe('DROPDOWN_VALUE_REQUIRED');
      expect(errors.frequency).toBe('DROPDOWN_VALUE_REQUIRED');
      expect(errors.route).toBe('DROPDOWN_VALUE_REQUIRED');
      expect(errors.duration).toBe('INPUT_VALUE_REQUIRED');
      expect(errors.durationUnit).toBe('DROPDOWN_VALUE_REQUIRED');
      expect(result.current.selectedMedications[0].hasBeenValidated).toBe(true);
    });

    it('should return true when all required fields are valid', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDosage('med-123', 100);
        result.current.updateDosageUnit('med-123', mockConcept);
        result.current.updateFrequency('med-123', mockFrequency);
        result.current.updateRoute('med-123', mockConcept);
        result.current.updateDuration('med-123', 7);
        result.current.updateDurationUnit('med-123', mockDurationUnit);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(true);
      expect(result.current.selectedMedications[0].errors).toEqual({});
    });

    it('should not require duration for STAT medications', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDosage('med-123', 100);
        result.current.updateDosageUnit('med-123', mockConcept);
        result.current.updateFrequency('med-123', mockFrequency);
        result.current.updateRoute('med-123', mockConcept);
        result.current.updateisSTAT('med-123', true);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(true);
      const errors = result.current.selectedMedications[0].errors;
      expect(errors.duration).toBeUndefined();
      expect(errors.durationUnit).toBeUndefined();
    });

    it('should require duration for PRN medications when not STAT', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDosage('med-123', 100);
        result.current.updateDosageUnit('med-123', mockConcept);
        result.current.updateFrequency('med-123', mockFrequency);
        result.current.updateRoute('med-123', mockConcept);
        result.current.updateisPRN('med-123', true);
        result.current.updateisSTAT('med-123', false);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(false);
      const errors = result.current.selectedMedications[0].errors;
      expect(errors.duration).toBe('INPUT_VALUE_REQUIRED');
      expect(errors.durationUnit).toBe('DROPDOWN_VALUE_REQUIRED');
    });

    it('should not require duration when both STAT and PRN are true', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDosage('med-123', 100);
        result.current.updateDosageUnit('med-123', mockConcept);
        result.current.updateFrequency('med-123', mockFrequency);
        result.current.updateRoute('med-123', mockConcept);
        result.current.updateisPRN('med-123', true);
        result.current.updateisSTAT('med-123', true);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(true);
      const errors = result.current.selectedMedications[0].errors;
      expect(errors.duration).toBeUndefined();
      expect(errors.durationUnit).toBeUndefined();
    });

    it('should validate multiple medications independently', () => {
      const { result } = renderHook(() => useMedicationStore());
      const medication2 = { ...mockMedication, id: 'med-456' };

      act(() => {
        // First medication - invalid
        result.current.addMedication(mockMedication, 'Medication 1');

        // Second medication - valid
        result.current.addMedication(medication2, 'Medication 2');
        result.current.updateDosage('med-456', 50);
        result.current.updateDosageUnit('med-456', mockConcept);
        result.current.updateFrequency('med-456', mockFrequency);
        result.current.updateRoute('med-456', mockConcept);
        result.current.updateDuration('med-456', 5);
        result.current.updateDurationUnit('med-456', mockDurationUnit);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(false);
      expect(
        Object.keys(result.current.selectedMedications[1].errors).length,
      ).toBeGreaterThan(0);
      expect(result.current.selectedMedications[0].errors).toEqual({});
    });

    it('should preserve existing errors when validating', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        // First validation
        result.current.validateAllMedications();
        // Update some fields
        result.current.updateDosage('med-123', 100);
        result.current.updateDosageUnit('med-123', mockConcept);
        // Second validation
        result.current.validateAllMedications();
      });

      const errors = result.current.selectedMedications[0].errors;
      expect(errors.dosage).toBeUndefined();
      expect(errors.dosageUnit).toBeUndefined();
      expect(errors.frequency).toBe('DROPDOWN_VALUE_REQUIRED');
      expect(errors.route).toBe('DROPDOWN_VALUE_REQUIRED');
    });

    it('should handle edge case with zero dosage', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDosage('med-123', 0);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(false);
      expect(result.current.selectedMedications[0].errors.dosage).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });

    it('should handle edge case with negative duration', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDuration('med-123', -5);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(false);
      expect(result.current.selectedMedications[0].errors.duration).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });
  });

  describe('reset', () => {
    it('should clear all medications', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.addMedication(
          { ...mockMedication, id: 'med-456' },
          'Test Medication 2',
        );
        result.current.reset();
      });

      expect(result.current.selectedMedications).toHaveLength(0);
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });

      const state = result.current.getState();
      expect(state.selectedMedications).toHaveLength(1);
      expect(state.selectedMedications[0].id).toBe('med-123');
      expect(typeof state.addMedication).toBe('function');
      expect(typeof state.removeMedication).toBe('function');
    });
  });

  describe('Edge cases for non-existent medication IDs', () => {
    it('should handle update operations on non-existent medication gracefully', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDosage('non-existent-id', 100);
        result.current.updateDosageUnit('non-existent-id', mockConcept);
        result.current.updateFrequency('non-existent-id', mockFrequency);
        result.current.updateRoute('non-existent-id', mockConcept);
        result.current.updateDuration('non-existent-id', 7);
        result.current.updateDurationUnit('non-existent-id', mockDurationUnit);
        result.current.updateInstruction('non-existent-id', mockConcept);
        result.current.updateisPRN('non-existent-id', true);
        result.current.updateisSTAT('non-existent-id', true);
        result.current.updateStartDate('non-existent-id', new Date());
        result.current.updateDispenseQuantity('non-existent-id', 30);
        result.current.updateDispenseUnit('non-existent-id', mockConcept);
      });

      // Original medication should remain unchanged
      const medication = result.current.selectedMedications[0];
      expect(medication.dosage).toBe(0);
      expect(medication.dosageUnit).toBeNull();
      expect(medication.frequency).toBeNull();
      expect(medication.route).toBeNull();
      expect(medication.duration).toBe(0);
      expect(medication.durationUnit).toBeNull();
      expect(medication.instruction).toBeNull();
      expect(medication.isPRN).toBe(false);
      expect(medication.isSTAT).toBe(false);
      expect(medication.dispenseQuantity).toBe(0);
      expect(medication.dispenseUnit).toBeNull();
    });
  });
});
