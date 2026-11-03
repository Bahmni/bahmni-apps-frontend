import { OTHER_NON_CODED_ALLERGEN_UUID } from '@bahmni/services';
import { renderHook } from '@testing-library/react';
import { Coding } from 'fhir/r4';
import { act } from 'react';
import { ALLERGY_SEVERITY_CONCEPTS } from '../../constants/allergy';
import { AllergyInputEntry, AllergenConcept } from '../../models/allergy';
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

      const expectedAllergy = {
        id: mockAllergen.uuid,
        entryId: expect.any(String),
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

    test('should generate a unique entryId distinct from the concept id', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      const entry = result.current.selectedAllergies[0];
      expect(entry.entryId).toBeTruthy();
      expect(entry.entryId).not.toBe(entry.id);
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
      const { entryId } = result.current.selectedAllergies[0];

      act(() => {
        result.current.removeAllergy(entryId);
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
      const entryIdToRemove = result.current.selectedAllergies.find(
        (a) => a.id === mockAllergen.uuid,
      )!.entryId;

      act(() => {
        result.current.removeAllergy(entryIdToRemove);
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
      const { entryId } = result.current.selectedAllergies[0];

      act(() => {
        result.current.updateSeverity(entryId, ALLERGY_SEVERITY_CONCEPTS[0]);
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
      const { entryId } = result.current.selectedAllergies[0];

      act(() => {
        result.current.updateSeverity(entryId, ALLERGY_SEVERITY_CONCEPTS[0]);
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
      const { entryId } = result.current.selectedAllergies[0];

      act(() => {
        result.current.updateReactions(entryId, [mockReactions[0]]);
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
      const { entryId } = result.current.selectedAllergies[0];

      act(() => {
        result.current.updateReactions(entryId, [mockReactions[0]]);
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
      });
      const { entryId } = result.current.selectedAllergies[0];

      act(() => {
        result.current.updateReactions(entryId, [mockReactions[0]]);
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
      });
      const { entryId } = result.current.selectedAllergies[0];

      act(() => {
        result.current.updateSeverity(entryId, ALLERGY_SEVERITY_CONCEPTS[0]);
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
      });
      const { entryId } = result.current.selectedAllergies[0];

      act(() => {
        result.current.updateSeverity(entryId, ALLERGY_SEVERITY_CONCEPTS[0]);
        result.current.updateReactions(entryId, [mockReactions[0]]);
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
      });
      const { entryId } = result.current.selectedAllergies[0];

      act(() => {
        result.current.updateSeverity(entryId, ALLERGY_SEVERITY_CONCEPTS[0]);
        result.current.updateReactions(entryId, [mockReactions[0]]);
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
      const { entryId } = result.current.selectedAllergies[0];

      act(() => {
        result.current.updateNote(entryId, testNote);
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

  // PRELOAD ALLERGIES TESTS
  describe('preloadAllergies', () => {
    const preloadedEntry: AllergyInputEntry = {
      id: 'preloaded-1',
      entryId: 'preloaded-1',
      display: 'Shellfish',
      type: 'food',
      selectedSeverity: null,
      selectedReactions: [],
      errors: {},
      hasBeenValidated: false,
    };

    test('preloadAllergies sets all entries with isModified: false', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.preloadAllergies([preloadedEntry]);
      });

      expect(result.current.selectedAllergies).toHaveLength(1);
      expect(result.current.selectedAllergies[0].isModified).toBe(false);
    });

    test('preloadAllergies replaces existing selectedAllergies', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });
      expect(result.current.selectedAllergies).toHaveLength(1);

      act(() => {
        result.current.preloadAllergies([preloadedEntry]);
      });

      expect(result.current.selectedAllergies).toHaveLength(1);
      expect(result.current.selectedAllergies[0].id).toBe('preloaded-1');
    });
  });

  // ISMODIFIED TRACKING TESTS
  describe('isModified tracking', () => {
    const preloadedEntry: AllergyInputEntry = {
      id: 'preloaded-1',
      entryId: 'preloaded-1',
      display: 'Shellfish',
      type: 'food',
      selectedSeverity: null,
      selectedReactions: [],
      errors: {},
      hasBeenValidated: false,
    };

    test('updateSeverity sets isModified: true on the modified allergy', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.preloadAllergies([preloadedEntry]);
      });
      expect(result.current.selectedAllergies[0].isModified).toBe(false);

      act(() => {
        result.current.updateSeverity(
          'preloaded-1',
          ALLERGY_SEVERITY_CONCEPTS[0],
        );
      });

      expect(result.current.selectedAllergies[0].isModified).toBe(true);
    });

    test('updateReactions sets isModified: true on the modified allergy', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.preloadAllergies([preloadedEntry]);
      });
      expect(result.current.selectedAllergies[0].isModified).toBe(false);

      act(() => {
        result.current.updateReactions('preloaded-1', [mockReactions[0]]);
      });

      expect(result.current.selectedAllergies[0].isModified).toBe(true);
    });

    test('updateNote sets isModified: true on the modified allergy', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.preloadAllergies([preloadedEntry]);
      });
      expect(result.current.selectedAllergies[0].isModified).toBe(false);

      act(() => {
        result.current.updateNote('preloaded-1', 'Some note');
      });

      expect(result.current.selectedAllergies[0].isModified).toBe(true);
    });

    test('addAllergy creates entry without isModified (undefined, not false)', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      expect(result.current.selectedAllergies[0].isModified).toBeUndefined();
    });
  });

  // HASDATA FUNCTION TESTS
  // hasData is defined in the index.ts registration as:
  // () => useAllergyStore.getState().selectedAllergies.some((a) => a.isModified !== false)
  describe('hasData logic (via store state)', () => {
    const preloadedEntry: AllergyInputEntry = {
      id: 'preloaded-1',
      entryId: 'preloaded-1',
      display: 'Shellfish',
      type: 'food',
      selectedSeverity: null,
      selectedReactions: [],
      errors: {},
      hasBeenValidated: false,
    };

    const hasData = () =>
      useAllergyStore
        .getState()
        .selectedAllergies.some((a) => a.isModified !== false);

    test('hasData returns false when all allergies have isModified: false (preloaded, unchanged)', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.preloadAllergies([preloadedEntry]);
      });

      expect(hasData()).toBe(false);
    });

    test('hasData returns true when at least one allergy has isModified: true', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.preloadAllergies([preloadedEntry]);
        result.current.updateSeverity(
          'preloaded-1',
          ALLERGY_SEVERITY_CONCEPTS[0],
        );
      });

      expect(hasData()).toBe(true);
    });

    test('hasData returns true when allergy has isModified: undefined (new allergy)', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });

      expect(hasData()).toBe(true);
    });
  });

  // MULTIPLE OTHER, NON-CODED ALLERGIES — REGRESSION TESTS
  // Every free-text "Other" allergy shares the same concept uuid
  // (OTHER_NON_CODED_ALLERGEN_UUID), so store operations must key off the
  // unique entryId, not id, or edits/removals on one would leak onto another.
  describe('multiple Other, Non-Coded allergies', () => {
    const otherAllergyOne: AllergyInputEntry = {
      id: OTHER_NON_CODED_ALLERGEN_UUID,
      entryId: 'other-entry-1',
      resourceId: 'resource-uuid-1',
      display: 'you',
      type: 'medication',
      nonCodedAllergen: 'you',
      selectedSeverity: ALLERGY_SEVERITY_CONCEPTS[0],
      selectedReactions: [mockReactions[0]],
      errors: {},
      hasBeenValidated: false,
    };

    const otherAllergyTwo: AllergyInputEntry = {
      id: OTHER_NON_CODED_ALLERGEN_UUID,
      entryId: 'other-entry-2',
      resourceId: 'resource-uuid-2',
      display: 'jj',
      type: 'medication',
      nonCodedAllergen: 'jj',
      selectedSeverity: ALLERGY_SEVERITY_CONCEPTS[1],
      selectedReactions: [mockReactions[1]],
      errors: {},
      hasBeenValidated: false,
    };

    const preloadBoth = () => {
      const { result } = renderHook(() => useAllergyStore());
      act(() => {
        result.current.preloadAllergies([otherAllergyOne, otherAllergyTwo]);
      });
      return result;
    };

    test('preloads both entries distinctly despite sharing the same concept id', () => {
      const result = preloadBoth();

      expect(result.current.selectedAllergies).toHaveLength(2);
      expect(
        result.current.selectedAllergies.every(
          (a) => a.id === OTHER_NON_CODED_ALLERGEN_UUID,
        ),
      ).toBe(true);
      // Distinct entryIds are what keeps the two records addressable.
      expect(result.current.selectedAllergies[0].entryId).not.toBe(
        result.current.selectedAllergies[1].entryId,
      );
    });

    test('updateSeverity on entry #1 does not modify entry #2', () => {
      const result = preloadBoth();

      act(() => {
        result.current.updateSeverity(
          'other-entry-1',
          ALLERGY_SEVERITY_CONCEPTS[2],
        );
      });

      const [first, second] = result.current.selectedAllergies;
      expect(first.selectedSeverity).toBe(ALLERGY_SEVERITY_CONCEPTS[2]);
      expect(second.selectedSeverity).toBe(otherAllergyTwo.selectedSeverity);
    });

    test('updateReactions on entry #1 does not modify entry #2', () => {
      const result = preloadBoth();

      act(() => {
        result.current.updateReactions('other-entry-1', mockReactions);
      });

      const [first, second] = result.current.selectedAllergies;
      expect(first.selectedReactions).toEqual(mockReactions);
      expect(second.selectedReactions).toEqual(
        otherAllergyTwo.selectedReactions,
      );
    });

    test('updateNonCodedAllergen (free text) on entry #1 does not modify entry #2', () => {
      const result = preloadBoth();

      act(() => {
        result.current.updateNonCodedAllergen(
          'other-entry-1',
          'Updated free text',
        );
      });

      const [first, second] = result.current.selectedAllergies;
      expect(first.nonCodedAllergen).toBe('Updated free text');
      expect(second.nonCodedAllergen).toBe('jj');
    });

    test('updateNote on entry #1 does not modify entry #2', () => {
      const result = preloadBoth();

      act(() => {
        result.current.updateNote('other-entry-1', 'A note for entry one');
      });

      const [first, second] = result.current.selectedAllergies;
      expect(first.note).toBe('A note for entry one');
      expect(second.note).toBeUndefined();
    });

    test('removeAllergy removes only entry #1, leaving entry #2 intact', () => {
      const result = preloadBoth();

      act(() => {
        result.current.removeAllergy('other-entry-1');
      });

      expect(result.current.selectedAllergies).toHaveLength(1);
      expect(result.current.selectedAllergies[0].entryId).toBe('other-entry-2');
      expect(result.current.selectedAllergies[0].nonCodedAllergen).toBe('jj');
    });

    test('setResourceId on entry #1 does not modify entry #2', () => {
      const result = preloadBoth();

      act(() => {
        result.current.setResourceId('other-entry-1', 'new-resource-uuid');
      });

      const [first, second] = result.current.selectedAllergies;
      expect(first.resourceId).toBe('new-resource-uuid');
      expect(second.resourceId).toBe('resource-uuid-2');
    });
  });

  // Regression: the encounter bundle is one all-or-nothing transaction, so
  // once it succeeds every coded allergy that was pending is persisted —
  // even a brand-new one with no resourceId yet. This must be reflected in
  // the store so a retry after a later direct-submit failure doesn't send
  // them through createAllergiesBundleEntries again (see allergies/index.ts).
  describe('markCodedAllergiesAsSaved', () => {
    test('marks a pending coded allergy as unmodified', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy(mockAllergen);
      });
      expect(result.current.selectedAllergies[0].isModified).toBeUndefined();

      act(() => {
        result.current.markCodedAllergiesAsSaved();
      });

      expect(result.current.selectedAllergies[0].isModified).toBe(false);
    });

    test('leaves a pending Other, Non-Coded allergy untouched, since it is saved separately over REST', () => {
      const { result } = renderHook(() => useAllergyStore());

      act(() => {
        result.current.addAllergy({
          uuid: OTHER_NON_CODED_ALLERGEN_UUID,
          display: 'Other, Non-Coded',
          type: 'food',
        });
      });

      act(() => {
        result.current.markCodedAllergiesAsSaved();
      });

      expect(result.current.selectedAllergies[0].isModified).toBeUndefined();
    });
  });
});
