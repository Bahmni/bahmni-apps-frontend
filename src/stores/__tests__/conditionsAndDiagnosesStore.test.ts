import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useConditionsAndDiagnosesStore } from '../conditionsAndDiagnosesStore';
import { ConceptSearch } from '@types/concepts';
import { DiagnosisInputEntry } from '@types/diagnosis';
import { ConditionInputEntry } from '@types/condition';
import { Coding } from 'fhir/r4';

const mockConcept: ConceptSearch = {
  conceptUuid: 'test-concept-1',
  conceptName: 'Hypertension',
  matchedName: 'Hypertension',
};

const mockConcept2: ConceptSearch = {
  conceptUuid: 'test-concept-2',
  conceptName: 'Diabetes',
  matchedName: 'Diabetes',
};

const mockConcept3: ConceptSearch = {
  conceptUuid: 'test-concept-3',
  conceptName: 'Asthma',
  matchedName: 'Asthma',
};

const mockCertainty: Coding = {
  code: 'confirmed',
  display: 'Confirmed',
  system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
};

const mockCertainty2: Coding = {
  code: 'provisional',
  display: 'Provisional',
  system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
};

describe('useConditionsAndDiagnosesStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useConditionsAndDiagnosesStore());
    act(() => {
      result.current.reset();
    });
  });

  // INITIALIZATION TESTS
  describe('Initialization', () => {
    test('should initialize with empty selected diagnoses and conditions', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());
      expect(result.current.selectedDiagnoses).toEqual([]);
      expect(result.current.selectedConditions).toEqual([]);
    });
  });

  // ADD DIAGNOSIS TESTS
  describe('addDiagnosis', () => {
    test('should add a new diagnosis to the store', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      const expectedDiagnosis: DiagnosisInputEntry = {
        id: mockConcept.conceptUuid,
        display: mockConcept.conceptName,
        selectedCertainty: null,
        errors: {},
        hasBeenValidated: false,
      };

      expect(result.current.selectedDiagnoses).toHaveLength(1);
      expect(result.current.selectedDiagnoses[0]).toEqual(expectedDiagnosis);
    });

    test('should add multiple diagnoses to the store with newest first', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.addDiagnosis(mockConcept2);
      });

      expect(result.current.selectedDiagnoses).toHaveLength(2);
      // Newest should be first
      expect(result.current.selectedDiagnoses[0].id).toBe(
        mockConcept2.conceptUuid,
      );
      expect(result.current.selectedDiagnoses[1].id).toBe(
        mockConcept.conceptUuid,
      );
    });

    test('should not add duplicate diagnoses', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.addDiagnosis(mockConcept); // Duplicate
      });

      expect(result.current.selectedDiagnoses).toHaveLength(1);
      expect(result.current.selectedDiagnoses[0].id).toBe(
        mockConcept.conceptUuid,
      );
    });

    test('should not add diagnosis with invalid concept', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      const invalidConcept1 = {
        conceptUuid: '',
        conceptName: 'Valid Name',
        matchedName: 'Valid Name',
      };

      const invalidConcept2 = {
        conceptUuid: 'valid-uuid',
        conceptName: '',
        matchedName: 'Valid Name',
      };

      act(() => {
        result.current.addDiagnosis(invalidConcept1);
        result.current.addDiagnosis(invalidConcept2);
      });

      expect(result.current.selectedDiagnoses).toHaveLength(0);
    });

    test('should not add diagnosis with null or undefined concept', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result.current.addDiagnosis(null as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result.current.addDiagnosis(undefined as any);
      });

      expect(result.current.selectedDiagnoses).toHaveLength(0);
    });
  });

  // REMOVE DIAGNOSIS TESTS
  describe('removeDiagnosis', () => {
    test('should remove a diagnosis from the store', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      expect(result.current.selectedDiagnoses).toHaveLength(1);

      act(() => {
        result.current.removeDiagnosis(mockConcept.conceptUuid);
      });

      expect(result.current.selectedDiagnoses).toHaveLength(0);
    });

    test('should only remove the specified diagnosis', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.addDiagnosis(mockConcept2);
      });

      expect(result.current.selectedDiagnoses).toHaveLength(2);

      act(() => {
        result.current.removeDiagnosis(mockConcept.conceptUuid);
      });

      expect(result.current.selectedDiagnoses).toHaveLength(1);
      expect(result.current.selectedDiagnoses[0].id).toBe(
        mockConcept2.conceptUuid,
      );
    });

    test('should not remove diagnosis with invalid ID', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      expect(result.current.selectedDiagnoses).toHaveLength(1);

      act(() => {
        result.current.removeDiagnosis('');
        result.current.removeDiagnosis('   ');
      });

      expect(result.current.selectedDiagnoses).toHaveLength(1);
    });
  });

  // UPDATE CERTAINTY TESTS
  describe('updateCertainty', () => {
    test('should update certainty for a diagnosis', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      act(() => {
        result.current.updateCertainty(mockConcept.conceptUuid, mockCertainty);
      });

      expect(result.current.selectedDiagnoses[0].selectedCertainty).toBe(
        mockCertainty,
      );
    });

    test('should clear certainty validation error when certainty is updated', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.validate();
      });

      expect(
        result.current.selectedDiagnoses[0].errors.certainty,
      ).toBeDefined();

      act(() => {
        result.current.updateCertainty(mockConcept.conceptUuid, mockCertainty);
      });

      expect(
        result.current.selectedDiagnoses[0].errors.certainty,
      ).toBeUndefined();
    });

    test('should set certainty to null when null is passed', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.updateCertainty(mockConcept.conceptUuid, mockCertainty);
      });

      expect(result.current.selectedDiagnoses[0].selectedCertainty).toBe(
        mockCertainty,
      );

      act(() => {
        result.current.updateCertainty(mockConcept.conceptUuid, null);
      });

      expect(result.current.selectedDiagnoses[0].selectedCertainty).toBe(null);
    });

    test('should not update certainty with invalid diagnosis ID', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      const originalCertainty =
        result.current.selectedDiagnoses[0].selectedCertainty;

      act(() => {
        result.current.updateCertainty('', mockCertainty);
        result.current.updateCertainty('   ', mockCertainty);
      });

      expect(result.current.selectedDiagnoses[0].selectedCertainty).toBe(
        originalCertainty,
      );
    });
  });

  // VALIDATE TESTS
  describe('validate', () => {
    test('should return false and set errors when certainty is missing', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedDiagnoses[0].errors.certainty).toBe(
        'DROPDOWN_VALUE_REQUIRED',
      );
      expect(result.current.selectedDiagnoses[0].hasBeenValidated).toBe(true);
    });

    test('should return true when all diagnoses have certainty', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.updateCertainty(mockConcept.conceptUuid, mockCertainty);
      });

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(true);
      expect(result.current.selectedDiagnoses[0].errors).toEqual({});
      expect(result.current.selectedDiagnoses[0].hasBeenValidated).toBe(true);
    });

    test('should validate multiple diagnoses correctly', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.addDiagnosis(mockConcept2);
        result.current.updateCertainty(mockConcept.conceptUuid, mockCertainty);
        // mockConcept2 has no certainty
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);

      // Find the diagnoses by ID since order matters
      const diagnosis1 = result.current.selectedDiagnoses.find(
        (d) => d.id === mockConcept.conceptUuid,
      );
      const diagnosis2 = result.current.selectedDiagnoses.find(
        (d) => d.id === mockConcept2.conceptUuid,
      );

      expect(diagnosis1?.errors).toEqual({});
      expect(diagnosis2?.errors.certainty).toBe('DROPDOWN_VALUE_REQUIRED');
    });

    test('should return false and set errors when condition duration is missing', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedConditions[0].errors.durationValue).toBe(
        'CONDITIONS_DURATION_VALUE_REQUIRED',
      );
      expect(result.current.selectedConditions[0].errors.durationUnit).toBe(
        'CONDITIONS_DURATION_UNIT_REQUIRED',
      );
      expect(result.current.selectedConditions[0].hasBeenValidated).toBe(true);
    });

    test('should return false when only condition duration value is provided', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          5,
          null,
        );
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(
        result.current.selectedConditions[0].errors.durationValue,
      ).toBeUndefined();
      expect(result.current.selectedConditions[0].errors.durationUnit).toBe(
        'CONDITIONS_DURATION_UNIT_REQUIRED',
      );
    });

    test('should return false when only condition duration unit is provided', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          null,
          'days',
        );
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedConditions[0].errors.durationValue).toBe(
        'CONDITIONS_DURATION_VALUE_REQUIRED',
      );
      expect(
        result.current.selectedConditions[0].errors.durationUnit,
      ).toBeUndefined();
    });

    test('should return true when all conditions have valid duration', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          5,
          'days',
        );
      });

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(true);
      expect(result.current.selectedConditions[0].errors).toEqual({});
      expect(result.current.selectedConditions[0].hasBeenValidated).toBe(true);
    });

    test('should validate multiple conditions correctly', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.addDiagnosis(mockConcept2);
        result.current.markAsCondition(mockConcept.conceptUuid);
        result.current.markAsCondition(mockConcept2.conceptUuid);
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          5,
          'days',
        );
        // mockConcept2 has no duration
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);

      // Find the conditions by ID since order matters
      const condition1 = result.current.selectedConditions.find(
        (c) => c.id === mockConcept.conceptUuid,
      );
      const condition2 = result.current.selectedConditions.find(
        (c) => c.id === mockConcept2.conceptUuid,
      );

      expect(condition1?.errors).toEqual({});
      expect(condition2?.errors.durationValue).toBe(
        'CONDITIONS_DURATION_VALUE_REQUIRED',
      );
      expect(condition2?.errors.durationUnit).toBe(
        'CONDITIONS_DURATION_UNIT_REQUIRED',
      );
    });

    test('should validate both diagnoses and conditions together', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.addDiagnosis(mockConcept2);
        result.current.addDiagnosis(mockConcept3);
        result.current.markAsCondition(mockConcept2.conceptUuid);
        // mockConcept has no certainty
        // mockConcept2 condition has no duration
        // mockConcept3 has no certainty
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);

      // Check diagnoses errors
      const diagnosis1 = result.current.selectedDiagnoses.find(
        (d) => d.id === mockConcept.conceptUuid,
      );
      const diagnosis3 = result.current.selectedDiagnoses.find(
        (d) => d.id === mockConcept3.conceptUuid,
      );

      expect(diagnosis1?.errors.certainty).toBe('DROPDOWN_VALUE_REQUIRED');
      expect(diagnosis3?.errors.certainty).toBe('DROPDOWN_VALUE_REQUIRED');

      // Check conditions errors
      const condition2 = result.current.selectedConditions.find(
        (c) => c.id === mockConcept2.conceptUuid,
      );

      expect(condition2?.errors.durationValue).toBe(
        'CONDITIONS_DURATION_VALUE_REQUIRED',
      );
      expect(condition2?.errors.durationUnit).toBe(
        'CONDITIONS_DURATION_UNIT_REQUIRED',
      );
    });

    test('should return true when both diagnoses and conditions are valid', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.addDiagnosis(mockConcept2);
        result.current.updateCertainty(mockConcept.conceptUuid, mockCertainty);
        result.current.updateCertainty(
          mockConcept2.conceptUuid,
          mockCertainty2,
        );
        result.current.markAsCondition(mockConcept2.conceptUuid);
        result.current.updateConditionDuration(
          mockConcept2.conceptUuid,
          7,
          'days',
        );
      });

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(true);
      expect(result.current.selectedDiagnoses[0].errors).toEqual({});
      expect(result.current.selectedConditions[0].errors).toEqual({});
    });

    test('should return true for empty store', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(true);
    });

    test('should validate all items even if some fail early', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.addDiagnosis(mockConcept2);
        result.current.addDiagnosis(mockConcept3);
        result.current.markAsCondition(mockConcept2.conceptUuid);
        result.current.markAsCondition(mockConcept3.conceptUuid);
        // All items are invalid
      });

      act(() => {
        result.current.validate();
      });

      // All diagnoses should be marked as validated with errors
      expect(result.current.selectedDiagnoses).toHaveLength(1);
      expect(result.current.selectedDiagnoses[0].hasBeenValidated).toBe(true);
      expect(result.current.selectedDiagnoses[0].errors.certainty).toBe(
        'DROPDOWN_VALUE_REQUIRED',
      );

      // All conditions should be marked as validated with errors
      expect(result.current.selectedConditions).toHaveLength(2);
      result.current.selectedConditions.forEach((condition) => {
        expect(condition.hasBeenValidated).toBe(true);
        expect(condition.errors.durationValue).toBe(
          'CONDITIONS_DURATION_VALUE_REQUIRED',
        );
        expect(condition.errors.durationUnit).toBe(
          'CONDITIONS_DURATION_UNIT_REQUIRED',
        );
      });
    });
  });

  // MARK AS CONDITION TESTS
  describe('markAsCondition', () => {
    test('should successfully move diagnosis to conditions', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      expect(result.current.selectedDiagnoses).toHaveLength(1);
      expect(result.current.selectedConditions).toHaveLength(0);

      let success: boolean = false;
      act(() => {
        success = result.current.markAsCondition(mockConcept.conceptUuid);
      });

      expect(success).toBe(true);
      expect(result.current.selectedDiagnoses).toHaveLength(0);
      expect(result.current.selectedConditions).toHaveLength(1);

      const expectedCondition: ConditionInputEntry = {
        id: mockConcept.conceptUuid,
        display: mockConcept.conceptName,
        durationValue: null,
        durationUnit: null,
        errors: {},
        hasBeenValidated: false,
      };

      expect(result.current.selectedConditions[0]).toEqual(expectedCondition);
    });

    test('should return false if diagnosis does not exist', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      let success: boolean = true;
      act(() => {
        success = result.current.markAsCondition('non-existent-id');
      });

      expect(success).toBe(false);
      expect(result.current.selectedDiagnoses).toHaveLength(0);
      expect(result.current.selectedConditions).toHaveLength(0);
    });

    test('should return false if condition already exists', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
      });

      // Add the same diagnosis again
      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      let success: boolean = true;
      act(() => {
        success = result.current.markAsCondition(mockConcept.conceptUuid);
      });

      expect(success).toBe(false);
      expect(result.current.selectedConditions).toHaveLength(1);
      expect(result.current.selectedDiagnoses).toHaveLength(1);
    });

    test('should return false with invalid diagnosis ID', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      let success: boolean = true;
      act(() => {
        success = result.current.markAsCondition('');
      });

      expect(success).toBe(false);

      act(() => {
        success = result.current.markAsCondition('   ');
      });

      expect(success).toBe(false);
    });
  });

  // REMOVE CONDITION TESTS
  describe('removeCondition', () => {
    test('should remove a condition from the store', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
      });

      expect(result.current.selectedConditions).toHaveLength(1);

      act(() => {
        result.current.removeCondition(mockConcept.conceptUuid);
      });

      expect(result.current.selectedConditions).toHaveLength(0);
    });

    test('should only remove the specified condition', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.addDiagnosis(mockConcept2);
        result.current.markAsCondition(mockConcept.conceptUuid);
        result.current.markAsCondition(mockConcept2.conceptUuid);
      });

      expect(result.current.selectedConditions).toHaveLength(2);

      act(() => {
        result.current.removeCondition(mockConcept.conceptUuid);
      });

      expect(result.current.selectedConditions).toHaveLength(1);
      expect(result.current.selectedConditions[0].id).toBe(
        mockConcept2.conceptUuid,
      );
    });

    test('should not remove condition with invalid ID', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
      });

      expect(result.current.selectedConditions).toHaveLength(1);

      act(() => {
        result.current.removeCondition('');
        result.current.removeCondition('   ');
      });

      expect(result.current.selectedConditions).toHaveLength(1);
    });
  });

  // UPDATE CONDITION DURATION TESTS
  describe('updateConditionDuration', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());
      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
      });
    });

    test('should update duration value and unit for a condition', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          5,
          'days',
        );
      });

      expect(result.current.selectedConditions[0].durationValue).toBe(5);
      expect(result.current.selectedConditions[0].durationUnit).toBe('days');
    });

    test('should update duration with different units', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          2,
          'months',
        );
      });

      expect(result.current.selectedConditions[0].durationValue).toBe(2);
      expect(result.current.selectedConditions[0].durationUnit).toBe('months');

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          1,
          'years',
        );
      });

      expect(result.current.selectedConditions[0].durationValue).toBe(1);
      expect(result.current.selectedConditions[0].durationUnit).toBe('years');
    });

    test('should set values to null when null is passed', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          5,
          'days',
        );
      });

      expect(result.current.selectedConditions[0].durationValue).toBe(5);
      expect(result.current.selectedConditions[0].durationUnit).toBe('days');

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          null,
          null,
        );
      });

      expect(result.current.selectedConditions[0].durationValue).toBe(null);
      expect(result.current.selectedConditions[0].durationUnit).toBe(null);
    });

    test('should clear validation errors when valid duration is set', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.validate();
      });

      expect(
        result.current.selectedConditions[0].errors.durationValue,
      ).toBeDefined();
      expect(
        result.current.selectedConditions[0].errors.durationUnit,
      ).toBeDefined();

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          5,
          'days',
        );
      });

      expect(
        result.current.selectedConditions[0].errors.durationValue,
      ).toBeUndefined();
      expect(
        result.current.selectedConditions[0].errors.durationUnit,
      ).toBeUndefined();
    });

    test('should not update with invalid condition ID', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      const originalValue = result.current.selectedConditions[0].durationValue;
      const originalUnit = result.current.selectedConditions[0].durationUnit;

      act(() => {
        result.current.updateConditionDuration('', 5, 'days');
        result.current.updateConditionDuration('   ', 5, 'days');
      });

      expect(result.current.selectedConditions[0].durationValue).toBe(
        originalValue,
      );
      expect(result.current.selectedConditions[0].durationUnit).toBe(
        originalUnit,
      );
    });

    test('should not update with invalid duration value', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      const originalValue = result.current.selectedConditions[0].durationValue;
      const originalUnit = result.current.selectedConditions[0].durationUnit;

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          0,
          'days',
        );
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          -5,
          'days',
        );
      });

      expect(result.current.selectedConditions[0].durationValue).toBe(
        originalValue,
      );
      expect(result.current.selectedConditions[0].durationUnit).toBe(
        originalUnit,
      );
    });

    test('should not update with invalid duration unit', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      const originalValue = result.current.selectedConditions[0].durationValue;
      const originalUnit = result.current.selectedConditions[0].durationUnit;

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          5,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'invalid' as any,
        );
      });

      expect(result.current.selectedConditions[0].durationValue).toBe(
        originalValue,
      );
      expect(result.current.selectedConditions[0].durationUnit).toBe(
        originalUnit,
      );
    });

    test('should only accept positive integer duration values', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      // Test that positive integers work
      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          1,
          'days',
        );
      });
      expect(result.current.selectedConditions[0].durationValue).toBe(1);

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          10,
          'days',
        );
      });
      expect(result.current.selectedConditions[0].durationValue).toBe(10);

      // Test that decimal values are rejected
      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          5.5,
          'days',
        );
      });
      expect(result.current.selectedConditions[0].durationValue).toBe(10); // Should remain unchanged

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          1.1,
          'days',
        );
      });
      expect(result.current.selectedConditions[0].durationValue).toBe(10); // Should remain unchanged

      // Test that zero and negative values are rejected
      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          0,
          'days',
        );
      });
      expect(result.current.selectedConditions[0].durationValue).toBe(10); // Should remain unchanged

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          -1,
          'days',
        );
      });
      expect(result.current.selectedConditions[0].durationValue).toBe(10); // Should remain unchanged

      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          -10,
          'days',
        );
      });
      expect(result.current.selectedConditions[0].durationValue).toBe(10); // Should remain unchanged
    });

    test('should clear only durationValue error when only value is provided', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      // Validate to create errors
      act(() => {
        result.current.validate();
      });

      expect(
        result.current.selectedConditions[0].errors.durationValue,
      ).toBeDefined();
      expect(
        result.current.selectedConditions[0].errors.durationUnit,
      ).toBeDefined();

      // Update only the value, unit remains null
      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          5,
          null,
        );
      });

      expect(
        result.current.selectedConditions[0].errors.durationValue,
      ).toBeUndefined();
      expect(
        result.current.selectedConditions[0].errors.durationUnit,
      ).toBeDefined();
    });

    test('should clear only durationUnit error when only unit is provided', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      // Validate to create errors
      act(() => {
        result.current.validate();
      });

      expect(
        result.current.selectedConditions[0].errors.durationValue,
      ).toBeDefined();
      expect(
        result.current.selectedConditions[0].errors.durationUnit,
      ).toBeDefined();

      // Update only the unit, value remains null
      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          null,
          'days',
        );
      });

      expect(
        result.current.selectedConditions[0].errors.durationValue,
      ).toBeDefined();
      expect(
        result.current.selectedConditions[0].errors.durationUnit,
      ).toBeUndefined();
    });

    test('should not clear any errors when both value and unit are null', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      // First set some values
      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          5,
          'days',
        );
      });

      // Validate to create errors (won't create errors since values are set)
      act(() => {
        result.current.validate();
      });

      // Now reset to null to create error state
      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          null,
          null,
        );
        result.current.validate();
      });

      expect(
        result.current.selectedConditions[0].errors.durationValue,
      ).toBeDefined();
      expect(
        result.current.selectedConditions[0].errors.durationUnit,
      ).toBeDefined();

      // Update with both null again - should not clear errors
      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          null,
          null,
        );
      });

      expect(
        result.current.selectedConditions[0].errors.durationValue,
      ).toBeDefined();
      expect(
        result.current.selectedConditions[0].errors.durationUnit,
      ).toBeDefined();
    });
  });

  // RESET TESTS
  describe('reset', () => {
    test('should clear all selected diagnoses and conditions', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.addDiagnosis(mockConcept2);
        result.current.markAsCondition(mockConcept.conceptUuid);
        result.current.updateCertainty(mockConcept2.conceptUuid, mockCertainty);
      });

      expect(result.current.selectedDiagnoses).toHaveLength(1);
      expect(result.current.selectedConditions).toHaveLength(1);

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedDiagnoses).toHaveLength(0);
      expect(result.current.selectedConditions).toHaveLength(0);
    });
  });

  // GET STATE TESTS
  describe('getState', () => {
    test('should return current state', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
      });

      const state = result.current.getState();
      expect(state.selectedDiagnoses).toEqual(result.current.selectedDiagnoses);
      expect(state.selectedConditions).toEqual(
        result.current.selectedConditions,
      );
    });
  });

  // COMPLEX INTEGRATION TESTS
  describe('Integration Tests', () => {
    test('should handle complete workflow: add diagnosis, validate, mark as condition, validate', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      // Add diagnosis
      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      // Validate without certainty (should fail)
      let diagnosisValid: boolean = true;
      act(() => {
        diagnosisValid = result.current.validate();
      });
      expect(diagnosisValid).toBe(false);

      // Add certainty and validate (should pass)
      act(() => {
        result.current.updateCertainty(mockConcept.conceptUuid, mockCertainty);
        diagnosisValid = result.current.validate();
      });
      expect(diagnosisValid).toBe(true);

      // Mark as condition
      let markSuccess: boolean = false;
      act(() => {
        markSuccess = result.current.markAsCondition(mockConcept.conceptUuid);
      });
      expect(markSuccess).toBe(true);
      expect(result.current.selectedDiagnoses).toHaveLength(0);
      expect(result.current.selectedConditions).toHaveLength(1);

      // Validate condition without duration (should fail)
      let conditionValid: boolean = true;
      act(() => {
        conditionValid = result.current.validate();
      });
      expect(conditionValid).toBe(false);

      // Add duration and validate (should pass)
      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          5,
          'days',
        );
        conditionValid = result.current.validate();
      });
      expect(conditionValid).toBe(true);
    });

    test('should handle multiple diagnoses and conditions with mixed validation states', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      // Add multiple diagnoses
      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.addDiagnosis(mockConcept2);
        result.current.addDiagnosis(mockConcept3);
      });

      // Set certainty for some diagnoses
      act(() => {
        result.current.updateCertainty(mockConcept.conceptUuid, mockCertainty);
        result.current.updateCertainty(
          mockConcept2.conceptUuid,
          mockCertainty2,
        );
        // mockConcept3 has no certainty
      });

      // Mark some as conditions
      act(() => {
        result.current.markAsCondition(mockConcept.conceptUuid);
        result.current.markAsCondition(mockConcept2.conceptUuid);
      });

      // Set duration for one condition
      act(() => {
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          7,
          'days',
        );
        // mockConcept2 condition has no duration
      });

      // Validate diagnoses and conditions
      let allValid: boolean = true;
      act(() => {
        allValid = result.current.validate();
      });
      expect(allValid).toBe(false); // mockConcept3 has no certainty and mockConcept2 condition has no duration

      expect(result.current.selectedDiagnoses).toHaveLength(1);
      expect(result.current.selectedConditions).toHaveLength(2);
    });

    test('should maintain state consistency across complex operations', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      // Add diagnosis
      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      // Mark as condition
      act(() => {
        result.current.markAsCondition(mockConcept.conceptUuid);
      });

      // Try to mark the same ID as condition again (should fail)
      let success: boolean = true;
      act(() => {
        success = result.current.markAsCondition(mockConcept.conceptUuid);
      });
      expect(success).toBe(false);

      // Add the same concept as diagnosis again
      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      // Now we should have one condition and one diagnosis with the same concept
      expect(result.current.selectedDiagnoses).toHaveLength(1);
      expect(result.current.selectedConditions).toHaveLength(1);
      expect(result.current.selectedDiagnoses[0].id).toBe(
        mockConcept.conceptUuid,
      );
      expect(result.current.selectedConditions[0].id).toBe(
        mockConcept.conceptUuid,
      );
    });
  });

  // EDGE CASE TESTS
  describe('Edge Cases', () => {
    test('should handle operations on empty store gracefully', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      // Operations on empty store should not throw errors
      act(() => {
        result.current.removeDiagnosis('non-existent');
        result.current.removeCondition('non-existent');
        result.current.updateCertainty('non-existent', mockCertainty);
        result.current.updateConditionDuration('non-existent', 5, 'days');
      });

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(true); // No items to validate
      expect(result.current.selectedDiagnoses).toHaveLength(0);
      expect(result.current.selectedConditions).toHaveLength(0);
    });

    test('should handle validation state persistence correctly', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
      });

      // Validate (should fail and mark as validated)
      act(() => {
        result.current.validate();
      });

      expect(result.current.selectedDiagnoses[0].hasBeenValidated).toBe(true);
      expect(
        result.current.selectedDiagnoses[0].errors.certainty,
      ).toBeDefined();

      // Add certainty (should clear error but keep validated state)
      act(() => {
        result.current.updateCertainty(mockConcept.conceptUuid, mockCertainty);
      });

      expect(result.current.selectedDiagnoses[0].hasBeenValidated).toBe(true);
      expect(
        result.current.selectedDiagnoses[0].errors.certainty,
      ).toBeUndefined();
    });

    test('should handle reset after validation states correctly', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
        result.current.validate();
      });

      expect(result.current.selectedConditions[0].hasBeenValidated).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedDiagnoses).toHaveLength(0);
      expect(result.current.selectedConditions).toHaveLength(0);
    });
  });
});
