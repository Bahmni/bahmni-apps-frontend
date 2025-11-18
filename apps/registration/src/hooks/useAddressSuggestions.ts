import {
  getAddressHierarchyEntries,
  type AddressHierarchyEntry,
} from '@bahmni/services';
import { useQueries } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { AddressLevel, SelectedAddressMetadata } from './useAddressFields';

/**
 * Custom hook for managing address hierarchy suggestions
 * Handles API queries, filtering, debouncing, and suggestion clearing
 */
export function useAddressSuggestions(
  autocompleteFields: string[],
  levelsWithStrictEntry: AddressLevel[],
  selectedMetadata: SelectedAddressMetadata,
) {
  // Track search queries for autocomplete fields dynamically
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>(
    {},
  );

  // Track selected items for ComboBox (keep reference to the full object)
  const [selectedItems, setSelectedItems] = useState<
    Record<string, AddressHierarchyEntry | null>
  >({});

  // Track manually cleared suggestions (when parent changes)
  const [clearedSuggestions, setClearedSuggestions] = useState<Set<string>>(
    new Set(),
  );

  // Debounce timers
  const debounceTimers = useRef<Record<string, number | null>>({});

  /**
   * Get parent field UUID for hierarchical filtering
   * Uses levelsWithStrictEntry (hierarchical order), not displayLevels (display order)
   */
  const getParentUuid = useCallback(
    (fieldName: string): string | undefined => {
      const fieldIndex = levelsWithStrictEntry.findIndex(
        (level) => level.addressField === fieldName,
      );
      if (fieldIndex <= 0) return undefined; // No parent for first field

      // Get the parent field (previous field in hierarchical order)
      const parentField = levelsWithStrictEntry[fieldIndex - 1];
      return selectedMetadata[parentField.addressField]?.uuid;
    },
    [levelsWithStrictEntry, selectedMetadata],
  );

  // Dynamic TanStack queries for all autocomplete fields
  const suggestionQueries = useQueries({
    queries: autocompleteFields.map((fieldName) => ({
      queryKey: [
        'addressHierarchy',
        fieldName,
        searchQueries[fieldName],
        getParentUuid(fieldName), // Include parent UUID in query key
      ],
      queryFn: () => {
        const parentUuid = getParentUuid(fieldName);
        return getAddressHierarchyEntries(
          fieldName,
          searchQueries[fieldName],
          20, // default limit
          parentUuid, // Pass parent UUID for hierarchical filtering
        );
      },
      enabled: (searchQueries[fieldName]?.length ?? 0) >= 2,
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Map query results to field names - using a ref to avoid dependency issues
  const suggestionsRef = useRef<Record<string, AddressHierarchyEntry[]>>({});

  // Update the ref without triggering re-renders
  autocompleteFields.forEach((fieldName, index) => {
    suggestionsRef.current[fieldName] = suggestionQueries[index]?.data ?? [];
  });

  // Process and filter suggestions
  const suggestions = useMemo(() => {
    const result: Record<string, AddressHierarchyEntry[]> = {};
    autocompleteFields.forEach((fieldName, index) => {
      // Don't show suggestions if they've been manually cleared (parent changed)
      if (clearedSuggestions.has(fieldName)) {
        result[fieldName] = [];
      } else {
        const rawSuggestions = suggestionQueries[index]?.data ?? [];

        // WORKAROUND: Filter suggestions by parent UUID on frontend
        // (backend API doesn't always respect parent filter correctly)
        const expectedParentUuid = getParentUuid(fieldName);
        if (expectedParentUuid) {
          // Filter to only show entries whose parent matches the expected parent
          const filtered = rawSuggestions.filter((entry) => {
            // Check if this entry's parent UUID matches what we expect
            return entry.parent?.uuid === expectedParentUuid;
          });
          result[fieldName] = filtered;
        } else {
          // No parent filtering needed for top-level fields
          result[fieldName] = rawSuggestions;
        }
      }
    });
    return result;
  }, [
    autocompleteFields,
    suggestionQueries,
    clearedSuggestions,
    getParentUuid,
  ]);

  /**
   * Debounced search handler
   * Delays API call until user stops typing (200ms)
   */
  const debouncedSearchAddress = useCallback(
    (field: string, searchText: string) => {
      if (debounceTimers.current[field]) {
        clearTimeout(debounceTimers.current[field]!);
      }

      debounceTimers.current[field] = window.setTimeout(() => {
        setSearchQueries((prev) => ({ ...prev, [field]: searchText }));
      }, 200);
    },
    [],
  );

  /**
   * Clear search queries and suggestions for child fields
   * Called when parent field changes to ensure child suggestions are re-filtered
   */
  const clearChildSuggestions = useCallback(
    (fieldName: string) => {
      const fieldIndex = levelsWithStrictEntry.findIndex(
        (l) => l.addressField === fieldName,
      );

      if (fieldIndex >= 0 && fieldIndex < levelsWithStrictEntry.length - 1) {
        const childFieldsToClear: string[] = [];

        // Collect all child fields after this one
        for (let i = fieldIndex + 1; i < levelsWithStrictEntry.length; i++) {
          const childField = levelsWithStrictEntry[i].addressField;
          if (autocompleteFields.includes(childField)) {
            childFieldsToClear.push(childField);
          }
        }

        // Clear search queries for child fields
        setSearchQueries((prev) => {
          const updated = { ...prev };
          childFieldsToClear.forEach((childField) => {
            delete updated[childField];
          });
          return updated;
        });

        // Mark child fields as cleared to hide stale suggestions
        setClearedSuggestions((prev) => {
          const updated = new Set(prev);
          childFieldsToClear.forEach((childField) => updated.add(childField));
          return updated;
        });

        // Clear selectedItems for child fields to prevent controlled/uncontrolled warning
        setSelectedItems((prev) => {
          const updated = { ...prev };
          childFieldsToClear.forEach((childField) => {
            updated[childField] = null;
          });
          return updated;
        });
      }
    },
    [levelsWithStrictEntry, autocompleteFields, setSelectedItems],
  );

  /**
   * Un-mark a field as cleared (when user starts typing)
   */
  const unmarkFieldAsCleared = useCallback((fieldName: string) => {
    setClearedSuggestions((prev) => {
      const updated = new Set(prev);
      updated.delete(fieldName);
      return updated;
    });
  }, []);

  return {
    // State
    suggestions,
    selectedItems,
    setSelectedItems,
    suggestionsRef,

    // Functions
    debouncedSearchAddress,
    clearChildSuggestions,
    unmarkFieldAsCleared,
  };
}
