import { renderHook } from '@testing-library/react';
import { Coding } from 'fhir/r4';
import { act } from 'react';
import { ALLERGY_SEVERITY_CONCEPTS } from '@constants/concepts';
import { AllergyInputEntry } from '@types/allergy';
import { AllergenConcept } from '@types/concepts';
import { useAllergyStore } from '../allergyStore';

const mockAllergen: AllergenConcept = {
  uuid: 'test-allergy-1',
  display: 'Peanut Allergy',
  type: 'food',
};

const mockReactions: Coding[] = [
  {
    code: 'hives',
    display: 'REACTION_HIVES',
    system: 'http://snomed.info/sct',
  },
  {
    code: 'rash',
    display: 'REACTION_RASH',
    system: 'http://snomed.info/sct',
  },
];

describe('useAllergyStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAllergyStore());
    act(() => {
      result.current.reset();
    });
  });

  // INITIALIZATION TESTS
  describe('Initialization', () => {
    test('should initialize with empty selected allergies', () => {
      const { result } = renderHook(() => useAllergyStore());
      expect(result.current.selectedAllergies).toEqual([]);
    });
  });

  // ADD ALLERGY TESTS
  describe('addAllergy', () => {
    test('should add a new allergy to the store', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      const expectedAllergy: AllergyInputEntry = {
        id: mockAllergen.uuid,
        display: mockAllergen.display,
        type: mockAllergen.type,
        selectedSeverity: null,
        selectedReactions: [],
        errors: {},
        hasBeenValidated: false,
      };

      expect(result.current.selectedAllergies).toHaveLength(1);
      expect(result.current.selectedAllergies[0]).toEqual(expectedAllergy);
    });

    test('should add multiple allergies to the store', () => {
      const { result } = renderHook(() => useAllergyStore());
      const secondAllergen = {
        ...mockAllergen,
        uuid: 'test-allergy-2',
        display: 'Milk Allergy',
      };

      act(() => {
        result.current.addAllergy(mockAllergen);
        result.current.addAllergy(secondAllergen);
      });

      expect(result.current.selectedAllergies).toHaveLength(2);
      // Updated expectation: newest allergy should be at index 0 (newest first)
      expect(result.current.selectedAllergies[0].id).toBe(secondAllergen.uuid);
      expect(result.current.selectedAllergies[1].id).toBe(mockAllergen.uuid);
    });

    test('should add new allergies to the start of the array (newest first)', () => {
      const { result } = renderHook(() => useAllergyStore());
      const secondAllergen = {
        ...mockAllergen,
        uuid: 'test-allergy-2',
        display: 'Milk Allergy',
      };
      const thirdAllergen = {
        ...mockAllergen,
        uuid: 'test-allergy-3',
        display: 'Shellfish Allergy',
      };

      // Add first allergy
      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      expect(result.current.selectedAllergies).toHaveLength(1);
      expect(result.current.selectedAllergies[0].id).toBe(mockAllergen.uuid);

      // Add second allergy - should be at start
      act(() => {
        result.current.addAllergy(secondAllergen);
      });

      expect(result.current.selectedAllergies).toHaveLength(2);
      expect(result.current.selectedAllergies[0].id).toBe(secondAllergen.uuid);
      expect(result.current.selectedAllergies[1].id).toBe(mockAllergen.uuid);

      // Add third allergy - should be at start
      act(() => {
        result.current.addAllergy(thirdAllergen);
      });

      expect(result.current.selectedAllergies).toHaveLength(3);
      expect(result.current.selectedAllergies[0].id).toBe(thirdAllergen.uuid);
      expect(result.current.selectedAllergies[1].id).toBe(secondAllergen.uuid);
      expect(result.current.selectedAllergies[2].id).toBe(mockAllergen.uuid);
    });
  });

  // REMOVE ALLERGY TESTS
  describe('removeAllergy', () => {
    test('should remove an allergy from the store', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      expect(result.current.selectedAllergies).toHaveLength(1);

      act(() => {
        result.current.removeAllergy(mockAllergen.uuid);
      });

      expect(result.current.selectedAllergies).toHaveLength(0);
    });

    test('should only remove the specified allergy', () => {
      const { result } = renderHook(() => useAllergyStore());
      const secondAllergen = {
        ...mockAllergen,
        uuid: 'test-allergy-2',
        display: 'Milk Allergy',
      };

      act(() => {
        result.current.addAllergy(mockAllergen);
        result.current.addAllergy(secondAllergen);
      });

      expect(result.current.selectedAllergies).toHaveLength(2);

      act(() => {
        result.current.removeAllergy(mockAllergen.uuid);
      });

      expect(result.current.selectedAllergies).toHaveLength(1);
      expect(result.current.selectedAllergies[0].id).toBe(secondAllergen.uuid);
    });
  });

  // UPDATE SEVERITY TESTS
  describe('updateSeverity', () => {
    test('should update severity for an allergy', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      act(() => {
        result.current.updateSeverity(
          mockAllergen.uuid,
          ALLERGY_SEVERITY_CONCEPTS[0],
        );
      });

      expect(result.current.selectedAllergies[0].selectedSeverity).toBe(
        ALLERGY_SEVERITY_CONCEPTS[0],
      );
    });

    test('should clear severity validation error when severity is updated', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
        result.current.validateAllAllergies();
      });

      expect(result.current.selectedAllergies[0].errors.severity).toBeDefined();

      act(() => {
        result.current.updateSeverity(
          mockAllergen.uuid,
          ALLERGY_SEVERITY_CONCEPTS[0],
        );
      });

      expect(
        result.current.selectedAllergies[0].errors.severity,
      ).toBeUndefined();
    });
  });

  // UPDATE REACTIONS TESTS
  describe('updateReactions', () => {
    test('should update reactions for an allergy', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      act(() => {
        result.current.updateReactions(mockAllergen.uuid, [mockReactions[0]]);
      });

      expect(result.current.selectedAllergies[0].selectedReactions).toEqual([
        mockReactions[0],
      ]);
    });

    test('should clear reactions validation error when reactions are updated', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
        result.current.validateAllAllergies();
      });

      expect(
        result.current.selectedAllergies[0].errors.reactions,
      ).toBeDefined();

      act(() => {
        result.current.updateReactions(mockAllergen.uuid, [mockReactions[0]]);
      });

      expect(
        result.current.selectedAllergies[0].errors.reactions,
      ).toBeUndefined();
    });
  });

  // VALIDATION TESTS
  describe('validateAllAllergies', () => {
    test('should return false and set errors when severity is missing', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
        result.current.updateReactions(mockAllergen.uuid, [mockReactions[0]]);
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateAllAllergies();
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedAllergies[0].errors.severity).toBe(
        'DROPDOWN_VALUE_REQUIRED',
      );
      expect(result.current.selectedAllergies[0].hasBeenValidated).toBe(true);
    });

    test('should return false and set errors when reactions are missing', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
        result.current.updateSeverity(
          mockAllergen.uuid,
          ALLERGY_SEVERITY_CONCEPTS[0],
        );
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateAllAllergies();
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedAllergies[0].errors.reactions).toBe(
        'DROPDOWN_VALUE_REQUIRED',
      );
      expect(result.current.selectedAllergies[0].hasBeenValidated).toBe(true);
    });

    test('should return true when all required fields are filled', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
        result.current.updateSeverity(
          mockAllergen.uuid,
          ALLERGY_SEVERITY_CONCEPTS[0],
        );
        result.current.updateReactions(mockAllergen.uuid, [mockReactions[0]]);
      });

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateAllAllergies();
      });

      expect(isValid).toBe(true);
      expect(result.current.selectedAllergies[0].errors).toEqual({});
      expect(result.current.selectedAllergies[0].hasBeenValidated).toBe(true);
    });
  });

  // RESET TESTS
  describe('reset', () => {
    test('should clear all selected allergies', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
        result.current.updateSeverity(
          mockAllergen.uuid,
          ALLERGY_SEVERITY_CONCEPTS[0],
        );
        result.current.updateReactions(mockAllergen.uuid, [mockReactions[0]]);
      });

      expect(result.current.selectedAllergies).toHaveLength(1);

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedAllergies).toHaveLength(0);
    });
  });

  // UPDATE NOTE TESTS
  describe('updateNote', () => {
    test('should update note for an allergy', () => {
      const { result } = renderHook(() => useAllergyStore());
      const testNote = 'Patient experiences mild symptoms after exposure';

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      act(() => {
        result.current.updateNote(mockAllergen.uuid, testNote);
      });

      expect(result.current.selectedAllergies[0].note).toBe(testNote);
    });

    test('should handle updateNote with non-existent allergy ID gracefully', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      const originalState = [...result.current.selectedAllergies];

      act(() => {
        result.current.updateNote('non-existent-id', 'Test note');
      });

      // State should remain unchanged
      expect(result.current.selectedAllergies).toEqual(originalState);
    });
  });

  // OPERATIONS WITH NON-EXISTENT IDS
  describe('Operations with Non-existent IDs', () => {
    test('should handle updateSeverity with non-existent allergy ID gracefully', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      const originalState = [...result.current.selectedAllergies];

      act(() => {
        result.current.updateSeverity(
          'non-existent-id',
          ALLERGY_SEVERITY_CONCEPTS[0],
        );
      });

      expect(result.current.selectedAllergies).toEqual(originalState);
    });

    test('should handle updateReactions with non-existent allergy ID gracefully', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      const originalState = [...result.current.selectedAllergies];

      act(() => {
        result.current.updateReactions('non-existent-id', [mockReactions[0]]);
      });

      expect(result.current.selectedAllergies).toEqual(originalState);
    });

    test('should handle removeAllergy with non-existent ID gracefully', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      const originalState = [...result.current.selectedAllergies];

      act(() => {
        result.current.removeAllergy('non-existent-id');
      });

      expect(result.current.selectedAllergies).toEqual(originalState);
    });
  });

  // GET STATE TESTS
  describe('getState', () => {
    test('should return current state', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      const state = result.current.getState();
      expect(state.selectedAllergies).toEqual(result.current.selectedAllergies);
    });
  });
});
