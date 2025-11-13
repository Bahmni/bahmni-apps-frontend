import { useState, useMemo, useCallback } from 'react';

/**
 * Address level configuration
 */
export interface AddressLevel {
  addressField: string;
  name: string;
  required: boolean;
  isStrictEntry?: boolean;
}

/**
 * Address data structure
 */
export interface AddressData {
  [key: string]: string | null;
}

/**
 * Address hierarchy configuration
 */
export interface AddressHierarchyConfig {
  showAddressFieldsTopDown: boolean;
  strictAutocompleteFromLevel?: string;
}

/**
 * Metadata for selected address entries (for hierarchical searching)
 */
export interface SelectedAddressMetadata {
  [fieldName: string]: {
    uuid?: string;
    userGeneratedId?: string;
    value: string | null;
  };
}

/**
 * Selected item from autocomplete
 */
export interface AddressHierarchyItem {
  name: string;
  uuid?: string;
  userGeneratedId?: string;
  parent?: AddressHierarchyItem | undefined;
}

/**
 * Custom hook for managing address field logic with configurable hierarchy
 *
 * Features:
 * - Configurable display order (top-down or bottom-up)
 * - Hierarchical field relationships
 * - Strict autocomplete enforcement from specified level
 * - Auto-population of parent fields
 * - Child field clearing on parent change
 *
 * @param addressLevels - Array of address level configurations
 * @param config - Address hierarchy configuration (display order, strict levels)
 * @param initialAddress - Initial address data
 * @returns Object with address state and management functions
 */
export function useAddressFields(
  addressLevels: AddressLevel[],
  config: AddressHierarchyConfig,
  initialAddress?: AddressData,
) {
  const [address, setAddress] = useState<AddressData>(initialAddress || {});
  const [selectedMetadata, setSelectedMetadata] =
    useState<SelectedAddressMetadata>({});

  /**
   * Determine display order based on configuration
   * Top-down: Country → State → District → Village
   * Bottom-up: Village → District → State → Country
   */
  const displayLevels = useMemo(() => {
    if (config.showAddressFieldsTopDown) {
      // Top-down: maintain original order
      return addressLevels;
    } else {
      // Bottom-up: reverse order
      return [...addressLevels].reverse();
    }
  }, [addressLevels, config.showAddressFieldsTopDown]);

  /**
   * Configure strict autocomplete levels
   * Marks fields as requiring strict entry (selection from dropdown only)
   * from the specified level downwards in the hierarchy
   */
  const levelsWithStrictEntry = useMemo(() => {
    const levels = [...addressLevels].reverse(); // Process in hierarchical order
    let isStrictEntry = false;

    const processed = levels.map((level) => {
      if (config.strictAutocompleteFromLevel === level.addressField) {
        isStrictEntry = true;
      }
      return {
        ...level,
        isStrictEntry: isStrictEntry,
      };
    });

    return processed.reverse();
  }, [addressLevels, config.strictAutocompleteFromLevel]);

  /**
   * Chunk levels into rows (2 fields per row for UI layout)
   */
  const levelChunks = useMemo(() => {
    const chunks: AddressLevel[][] = [];
    for (let i = 0; i < displayLevels.length; i += 2) {
      chunks.push(displayLevels.slice(i, i + 2));
    }
    return chunks;
  }, [displayLevels]);

  /**
   * Find parent field for hierarchical validation
   * Returns the field name of the parent in the hierarchy
   */
  const findParentField = useCallback(
    (fieldName: string): string | null => {
      const index = levelsWithStrictEntry.findIndex(
        (level) => level.addressField === fieldName,
      );
      if (index > 0) {
        return levelsWithStrictEntry[index - 1].addressField;
      }
      return null;
    },
    [levelsWithStrictEntry],
  );

  /**
   * Check if field should be read-only
   * In top-down mode with strict entry, child fields are read-only until parent is selected
   */
  const isFieldReadOnly = useCallback(
    (level: AddressLevel): boolean => {
      if (!config.showAddressFieldsTopDown || !level.isStrictEntry) {
        return false;
      }

      const parentField = findParentField(level.addressField);
      if (!parentField) {
        return false; // Top-level field is never read-only
      }

      const parentValue = address[parentField];
      return !parentValue; // Read-only if parent has no value
    },
    [config.showAddressFieldsTopDown, address, findParentField],
  );

  /**
   * Get descendant fields (children) of a field
   * Returns all fields that are children of the specified field in the hierarchy
   */
  const getDescendantFields = useCallback(
    (fieldName: string): string[] => {
      const descendingOrder = [...levelsWithStrictEntry].reverse();
      const names = descendingOrder.map((l) => l.addressField);
      const index = names.indexOf(fieldName);
      return names.slice(0, index); // All fields before this one
    },
    [levelsWithStrictEntry],
  );

  /**
   * Clear child fields when parent changes
   * Clears both the field values and metadata
   */
  const clearChildFields = useCallback(
    (fieldName: string) => {
      const childFields = getDescendantFields(fieldName);

      setAddress((prev) => {
        const updated = { ...prev };
        childFields.forEach((child) => {
          updated[child] = null;
        });
        return updated;
      });

      setSelectedMetadata((prev) => {
        const updated = { ...prev };
        childFields.forEach((child) => {
          updated[child] = {
            uuid: undefined,
            userGeneratedId: undefined,
            value: null,
          };
        });
        return updated;
      });
    },
    [getDescendantFields],
  );

  /**
   * Handle field selection from autocomplete dropdown
   * Updates the field value and metadata, and auto-populates parent fields if provided
   */
  const handleFieldSelect = useCallback(
    (fieldName: string, selectedItem: AddressHierarchyItem) => {
      // Update the selected field
      setAddress((prev) => ({ ...prev, [fieldName]: selectedItem.name }));

      // Store metadata for hierarchical searching
      setSelectedMetadata((prev) => ({
        ...prev,
        [fieldName]: {
          uuid: selectedItem.uuid,
          userGeneratedId: selectedItem.userGeneratedId,
          value: selectedItem.name,
        },
      }));

      // Auto-populate parent fields if provided in the selected item
      if (selectedItem.parent) {
        const descendingOrder = [...levelsWithStrictEntry].reverse();
        const names = descendingOrder.map((l) => l.addressField);
        const index = names.indexOf(fieldName);
        const parentFields = names.slice(index + 1);

        let parent: AddressHierarchyItem | undefined = selectedItem.parent;
        parentFields.forEach((parentField) => {
          if (parent?.name) {
            const currentParent = parent; // Capture current parent before reassigning
            setAddress((prev) => ({ ...prev, [parentField]: currentParent.name }));
            setSelectedMetadata((prev) => ({
              ...prev,
              [parentField]: {
                uuid: currentParent.uuid,
                userGeneratedId: currentParent.userGeneratedId,
                value: currentParent.name,
              },
            }));
            parent = parent.parent;
          }
        });
      }
    },
    [levelsWithStrictEntry],
  );

  /**
   * Handle field change (manual typing)
   * Clears child fields and metadata when user manually types
   */
  const handleFieldChange = useCallback(
    (fieldName: string, value: string) => {
      setAddress((prev) => ({ ...prev, [fieldName]: value }));
      clearChildFields(fieldName);

      // Clear metadata when manually typing
      setSelectedMetadata((prev) => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], value: null },
      }));
    },
    [clearChildFields],
  );

  /**
   * Get parent UUID for hierarchical search
   * In top-down mode, returns the UUID of the parent field for filtering autocomplete results
   */
  const getParentUuid = useCallback(
    (fieldName: string): string | undefined => {
      if (!config.showAddressFieldsTopDown) {
        return undefined;
      }
      const parentField = findParentField(fieldName);
      return parentField ? selectedMetadata[parentField]?.uuid : undefined;
    },
    [config.showAddressFieldsTopDown, findParentField, selectedMetadata],
  );

  /**
   * Reset all address fields
   */
  const resetAddress = useCallback(() => {
    setAddress({});
    setSelectedMetadata({});
  }, []);

  /**
   * Set address programmatically
   */
  const setAddressData = useCallback((newAddress: AddressData) => {
    setAddress(newAddress);
  }, []);

  return {
    // State
    address,
    selectedMetadata,

    // Computed values
    displayLevels,
    levelChunks,
    levelsWithStrictEntry,

    // Functions
    isFieldReadOnly,
    handleFieldSelect,
    handleFieldChange,
    getParentUuid,
    clearChildFields,
    resetAddress,
    setAddressData,
  };
}
