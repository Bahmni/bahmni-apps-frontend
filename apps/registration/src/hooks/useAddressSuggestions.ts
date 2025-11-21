import {
  getAddressHierarchyEntries,
  type AddressHierarchyEntry,
} from '@bahmni/services';
import { useQueries } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { AddressLevel, SelectedAddressMetadata } from './useAddressFields';

export function useAddressSuggestions(
  autocompleteFields: string[],
  levelsWithStrictEntry: AddressLevel[],
  selectedMetadata: SelectedAddressMetadata,
) {
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>(
    {},
  );

  const [selectedItems, setSelectedItems] = useState<
    Record<string, AddressHierarchyEntry | null>
  >({});

  const [clearedSuggestions, setClearedSuggestions] = useState<Set<string>>(
    new Set(),
  );

  const debounceTimers = useRef<Record<string, number | null>>({});

  const getParentUuid = useCallback(
    (fieldName: string): string | undefined => {
      const fieldIndex = levelsWithStrictEntry.findIndex(
        (level) => level.addressField === fieldName,
      );
      if (fieldIndex <= 0) return undefined;

      const parentField = levelsWithStrictEntry[fieldIndex - 1];
      return selectedMetadata[parentField.addressField]?.uuid;
    },
    [levelsWithStrictEntry, selectedMetadata],
  );

  const suggestionQueries = useQueries({
    queries: autocompleteFields.map((fieldName) => ({
      queryKey: [
        'addressHierarchy',
        fieldName,
        searchQueries[fieldName],
        getParentUuid(fieldName),
      ],
      queryFn: () => {
        const parentUuid = getParentUuid(fieldName);
        return getAddressHierarchyEntries(
          fieldName,
          searchQueries[fieldName],
          20,
          parentUuid,
        );
      },
      enabled: (searchQueries[fieldName]?.length ?? 0) >= 2,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const suggestionsRef = useRef<Record<string, AddressHierarchyEntry[]>>({});

  autocompleteFields.forEach((fieldName, index) => {
    suggestionsRef.current[fieldName] = suggestionQueries[index]?.data ?? [];
  });

  const suggestions = useMemo(() => {
    const result: Record<string, AddressHierarchyEntry[]> = {};
    autocompleteFields.forEach((fieldName, index) => {
      if (clearedSuggestions.has(fieldName)) {
        result[fieldName] = [];
      } else {
        const rawSuggestions = suggestionQueries[index]?.data ?? [];

        const expectedParentUuid = getParentUuid(fieldName);
        if (expectedParentUuid) {
          const filtered = rawSuggestions.filter((entry) => {
            return entry.parent?.uuid === expectedParentUuid;
          });
          result[fieldName] = filtered;
        } else {
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

  const clearChildSuggestions = useCallback(
    (fieldName: string) => {
      const fieldIndex = levelsWithStrictEntry.findIndex(
        (l) => l.addressField === fieldName,
      );

      if (fieldIndex >= 0 && fieldIndex < levelsWithStrictEntry.length - 1) {
        const childFieldsToClear: string[] = [];

        for (let i = fieldIndex + 1; i < levelsWithStrictEntry.length; i++) {
          const childField = levelsWithStrictEntry[i].addressField;
          if (autocompleteFields.includes(childField)) {
            childFieldsToClear.push(childField);
          }
        }

        setSearchQueries((prev) => {
          const updated = { ...prev };
          childFieldsToClear.forEach((childField) => {
            delete updated[childField];
          });
          return updated;
        });

        setClearedSuggestions((prev) => {
          const updated = new Set(prev);
          childFieldsToClear.forEach((childField) => updated.add(childField));
          return updated;
        });

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

  const unmarkFieldAsCleared = useCallback((fieldName: string) => {
    setClearedSuggestions((prev) => {
      const updated = new Set(prev);
      updated.delete(fieldName);
      return updated;
    });
  }, []);

  return {
    suggestions,
    selectedItems,
    setSelectedItems,
    suggestionsRef,

    debouncedSearchAddress,
    clearChildSuggestions,
    unmarkFieldAsCleared,
  };
}
