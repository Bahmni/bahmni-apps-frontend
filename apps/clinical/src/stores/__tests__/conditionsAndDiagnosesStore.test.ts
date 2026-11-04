import {
  type ConditionInputEntry,
  type DiagnosisInputEntry,
} from '@bahmni/services';
import { renderHook } from '@testing-library/react';
import { Coding } from 'fhir/r4';
import { act } from 'react';
import {
  CONDITION_DURATION_REQUIRED_ERROR,
  type ConditionDurationField,
} from '../../constants/conditions';
import { ConceptSearch } from '../../models/concepts';
import {
  type ConditionsAndDiagnosesState,
  useConditionsAndDiagnosesStore,
} from '../conditionsAndDiagnosesStore';

const DURATION_REQUIRED = CONDITION_DURATION_REQUIRED_ERROR;

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
        result.current.addDiagnosis(null as any);

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

      expect(result.current.selectedDiagnoses[0].selectedCertainty).toBeNull();
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
      expect(result.current.selectedConditions[0].errors.duration).toBe(
        DURATION_REQUIRED,
      );
      expect(result.current.selectedConditions[0].hasBeenValidated).toBe(true);
    });

    test('should return false when all duration fields are 0', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          'years',
          0,
        );
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          'months',
          0,
        );
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          'days',
          0,
        );
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedConditions[0].errors.duration).toBe(
        DURATION_REQUIRED,
      );
    });

    test.each([
      ['only years = 2', { years: 2 }],
      ['only months = 18', { months: 18 }],
      ['only days = 10', { days: 10 }],
      ['1 year 6 months 10 days', { years: 1, months: 6, days: 10 }],
      ['years = 0 and months = 3', { years: 0, months: 3 }],
    ])(
      'should return true when duration is %s',
      (_label, duration: Partial<Record<ConditionDurationField, number>>) => {
        const { result } = renderHook(() => useConditionsAndDiagnosesStore());

        act(() => {
          result.current.addDiagnosis(mockConcept);
          result.current.markAsCondition(mockConcept.conceptUuid);
          (Object.keys(duration) as ConditionDurationField[]).forEach(
            (field) => {
              result.current.updateConditionDuration(
                mockConcept.conceptUuid,
                field,
                duration[field]!,
              );
            },
          );
        });

        let isValid: boolean = false;
        act(() => {
          isValid = result.current.validate();
        });

        expect(isValid).toBe(true);
        expect(result.current.selectedConditions[0].errors).toEqual({});
      },
    );

    test('should return true when all conditions have valid duration', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(mockConcept.conceptUuid);
        result.current.updateConditionDuration(
          mockConcept.conceptUuid,
          'days',
          5,
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
          'days',
          5,
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
      expect(condition2?.errors.duration).toBe(DURATION_REQUIRED);
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

      expect(condition2?.errors.duration).toBe(DURATION_REQUIRED);
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
          'days',
          7,
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
        expect(condition.errors.duration).toBe(DURATION_REQUIRED);
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
        durationYears: null,
        durationMonths: null,
        durationDays: null,
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

    test('should carry conceptSystem through addDiagnosis and markAsCondition', () => {
      const conceptWithSystem: ConceptSearch = {
        conceptUuid: 'snomed-concept-1',
        conceptName: 'Fracture',
        matchedName: 'Fracture',
        conceptSystem: 'http://snomed.info/sct',
      };
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.addDiagnosis(conceptWithSystem);
      });

      expect(result.current.selectedDiagnoses[0].conceptSystem).toBe(
        'http://snomed.info/sct',
      );

      act(() => {
        result.current.markAsCondition(conceptWithSystem.conceptUuid);
      });

      expect(result.current.selectedConditions[0].conceptSystem).toBe(
        'http://snomed.info/sct',
      );
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
    const id = mockConcept.conceptUuid;

    const getCondition = (
      result: { current: ConditionsAndDiagnosesState },
      conditionId: string = id,
    ) => result.current.selectedConditions.find((c) => c.id === conditionId)!;

    const durationOf = (condition: ConditionInputEntry) => ({
      years: condition.durationYears,
      months: condition.durationMonths,
      days: condition.durationDays,
    });

    beforeEach(() => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());
      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(id);
      });
    });

    test('should update only years and leave months and days empty', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.updateConditionDuration(id, 'years', 2);
      });

      expect(durationOf(getCondition(result))).toEqual({
        years: 2,
        months: null,
        days: null,
      });
    });

    test('should set each field independently and preserve the other two', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.updateConditionDuration(id, 'years', 1);
      });
      act(() => {
        result.current.updateConditionDuration(id, 'months', 6);
      });
      act(() => {
        result.current.updateConditionDuration(id, 'days', 10);
      });

      expect(durationOf(getCondition(result))).toEqual({
        years: 1,
        months: 6,
        days: 10,
      });

      act(() => {
        result.current.updateConditionDuration(id, 'months', 3);
      });

      expect(durationOf(getCondition(result))).toEqual({
        years: 1,
        months: 3,
        days: 10,
      });
    });

    test('should clear only the given field when null is passed', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.updateConditionDuration(id, 'years', 1);
        result.current.updateConditionDuration(id, 'months', 6);
        result.current.updateConditionDuration(id, 'days', 10);
      });
      act(() => {
        result.current.updateConditionDuration(id, 'months', null);
      });

      expect(durationOf(getCondition(result))).toEqual({
        years: 1,
        months: null,
        days: 10,
      });
    });

    test('should accept 0 as a value', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.updateConditionDuration(id, 'years', 0);
      });

      expect(getCondition(result).durationYears).toBe(0);
    });

    test('should accept values at the field limits', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.updateConditionDuration(id, 'years', 150);
        result.current.updateConditionDuration(id, 'months', 999);
        result.current.updateConditionDuration(id, 'days', 999);
      });

      expect(durationOf(getCondition(result))).toEqual({
        years: 150,
        months: 999,
        days: 999,
      });
    });

    test.each<[string, ConditionDurationField, number]>([
      ['negative years', 'years', -3],
      ['negative months', 'months', -1],
      ['negative days', 'days', -10],
      ['decimal years', 'years', 2.4],
      ['decimal days', 'days', 5.5],
      ['NaN months', 'months', NaN],
      ['Infinity days', 'days', Infinity],
      ['years above 150', 'years', 151],
      ['months above 999', 'months', 1000],
      ['days above 999', 'days', 1000],
    ])(
      'should ignore invalid value (%s) and keep all fields unchanged',
      (_label, field, value) => {
        const { result } = renderHook(() => useConditionsAndDiagnosesStore());

        act(() => {
          result.current.updateConditionDuration(id, 'years', 1);
          result.current.updateConditionDuration(id, 'months', 2);
          result.current.updateConditionDuration(id, 'days', 3);
        });
        act(() => {
          result.current.updateConditionDuration(id, field, value);
        });

        expect(durationOf(getCondition(result))).toEqual({
          years: 1,
          months: 2,
          days: 3,
        });
      },
    );

    test('should ignore an unknown duration field', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      const before = getCondition(result);
      act(() => {
        result.current.updateConditionDuration(id, 'weeks' as any, 5);
      });

      expect(getCondition(result)).toEqual(before);
    });

    test('should not update with invalid condition ID', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      const before = getCondition(result);
      act(() => {
        result.current.updateConditionDuration('', 'days', 5);
        result.current.updateConditionDuration('   ', 'days', 5);
      });

      expect(getCondition(result)).toEqual(before);
    });

    test('should not set errors before the condition has been validated', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.updateConditionDuration(id, 'days', 5);
      });
      act(() => {
        result.current.updateConditionDuration(id, 'days', null);
      });

      expect(getCondition(result).hasBeenValidated).toBe(false);
      expect(getCondition(result).errors).toEqual({});
    });

    test('should clear the error live after validation and re-add it when all fields are cleared', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.validate();
      });
      expect(getCondition(result).errors.duration).toBe(DURATION_REQUIRED);

      act(() => {
        result.current.updateConditionDuration(id, 'days', 5);
      });
      expect(getCondition(result).errors.duration).toBeUndefined();

      act(() => {
        result.current.updateConditionDuration(id, 'days', null);
      });
      expect(getCondition(result).errors.duration).toBe(DURATION_REQUIRED);

      act(() => {
        result.current.updateConditionDuration(id, 'months', 0);
      });
      expect(getCondition(result).errors.duration).toBe(DURATION_REQUIRED);

      act(() => {
        result.current.updateConditionDuration(id, 'years', 1);
      });
      expect(getCondition(result).errors.duration).toBeUndefined();
    });

    test('should keep the error when an invalid value is entered after validation', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());

      act(() => {
        result.current.validate();
      });
      act(() => {
        result.current.updateConditionDuration(id, 'years', 151);
      });

      expect(getCondition(result).durationYears).toBeNull();
      expect(getCondition(result).errors.duration).toBe(DURATION_REQUIRED);
    });

    test('should keep two conditions independent (values and errors)', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());
      const id2 = mockConcept2.conceptUuid;

      act(() => {
        result.current.addDiagnosis(mockConcept2);
        result.current.markAsCondition(id2);
      });

      act(() => {
        result.current.updateConditionDuration(id, 'years', 2);
      });
      expect(durationOf(getCondition(result, id))).toEqual({
        years: 2,
        months: null,
        days: null,
      });
      expect(durationOf(getCondition(result, id2))).toEqual({
        years: null,
        months: null,
        days: null,
      });

      act(() => {
        result.current.updateConditionDuration(id, 'years', null);
        result.current.validate();
      });
      expect(getCondition(result, id).errors.duration).toBe(DURATION_REQUIRED);
      expect(getCondition(result, id2).errors.duration).toBe(DURATION_REQUIRED);

      act(() => {
        result.current.updateConditionDuration(id, 'months', 4);
      });
      expect(getCondition(result, id).errors.duration).toBeUndefined();
      expect(getCondition(result, id2).errors.duration).toBe(DURATION_REQUIRED);

      act(() => {
        result.current.updateConditionDuration(id2, 'days', -1);
        result.current.updateConditionDuration(id2, 'days', 7);
      });
      expect(durationOf(getCondition(result, id))).toEqual({
        years: null,
        months: 4,
        days: null,
      });
      expect(durationOf(getCondition(result, id2))).toEqual({
        years: null,
        months: null,
        days: 7,
      });
      expect(getCondition(result, id2).errors.duration).toBeUndefined();
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
          'days',
          5,
        );
        conditionValid = result.current.validate();
      });
      expect(conditionValid).toBe(true);
    });

    test('should validate a combined years/months/days duration and fail again once cleared', () => {
      const { result } = renderHook(() => useConditionsAndDiagnosesStore());
      const id = mockConcept.conceptUuid;

      act(() => {
        result.current.addDiagnosis(mockConcept);
        result.current.markAsCondition(id);
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });
      expect(isValid).toBe(false);

      act(() => {
        result.current.updateConditionDuration(id, 'years', 1);
        result.current.updateConditionDuration(id, 'months', 6);
        result.current.updateConditionDuration(id, 'days', 10);
      });
      act(() => {
        isValid = result.current.validate();
      });
      expect(isValid).toBe(true);
      expect(result.current.selectedConditions[0]).toMatchObject({
        durationYears: 1,
        durationMonths: 6,
        durationDays: 10,
        errors: {},
      });

      act(() => {
        result.current.updateConditionDuration(id, 'years', null);
        result.current.updateConditionDuration(id, 'months', null);
        result.current.updateConditionDuration(id, 'days', null);
      });
      act(() => {
        isValid = result.current.validate();
      });
      expect(isValid).toBe(false);
      expect(result.current.selectedConditions[0].errors.duration).toBe(
        DURATION_REQUIRED,
      );
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
          'days',
          7,
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
        result.current.updateConditionDuration('non-existent', 'days', 5);
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
