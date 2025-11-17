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
   * Configure strict autocomplete levels using cascade algorithm from old Bahmni
   *
   * Cascade Algorithm:
   * 1. Reverse array to iterate from most specific (child) to least specific (parent)
   * 2. Once the configured level is found, mark it AND all parent levels as strict
   * 3. Parent and ancestor levels require dropdown selection, child levels allow free text
   *
   * Purpose: Enforces data quality by requiring validated selections from broader categories
   */
  const levelsWithStrictEntry = useMemo(() => {
    if (!config.strictAutocompleteFromLevel) {
      // If no strict level configured, all fields are non-strict
      return addressLevels.map((level) => ({
        ...level,
        isStrictEntry: false,
      }));
    }

    const levels = [...addressLevels].reverse(); // Most specific to least specific
    let foundConfiguredLevel = false;

    const processed = levels.map((level) => {
      // Once we find the configured level, mark it and all subsequent (parent) levels as strict
      if (config.strictAutocompleteFromLevel === level.addressField) {
        foundConfiguredLevel = true;
      }
      return {
        ...level,
        isStrictEntry: foundConfiguredLevel,
      };
    });

    return processed.reverse(); // Restore original order
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
   * In top-down mode, child autocomplete fields are read-only until parent is selected
   * Free text fields are never read-only as they don't have hierarchical dependencies
   */
  const isFieldReadOnly = useCallback(
    (level: AddressLevel): boolean => {
      if (!config.showAddressFieldsTopDown) {
        return false;
      }

      // Only apply read-only logic to fields that have strict entry (hierarchical fields)
      // Free text fields should always be enabled
      if (!level.isStrictEntry) {
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
      // eslint-disable-next-line no-console
      console.log('[useAddressFields] handleFieldSelect called:', {
        fieldName,
        selectedItem,
      });

      // Update the selected field
      // Use userGeneratedId if available (e.g., postal codes), otherwise use name
      const fieldValue = selectedItem.userGeneratedId ?? selectedItem.name;
      setAddress((prev) => ({ ...prev, [fieldName]: fieldValue }));

      // Store metadata for hierarchical searching
      setSelectedMetadata((prev) => ({
        ...prev,
        [fieldName]: {
          uuid: selectedItem.uuid,
          userGeneratedId: selectedItem.userGeneratedId,
          value: fieldValue,
        },
      }));

      // eslint-disable-next-line no-console
      console.log('[useAddressFields] Checking for parent:', {
        hasParent: !!selectedItem.parent,
        parent: selectedItem.parent,
      });

      // Auto-populate parent fields if provided in the selected item
      if (selectedItem.parent) {
        // eslint-disable-next-line no-console
        console.log('[useAddressFields] Starting auto-population');
        const descendingOrder = [...levelsWithStrictEntry].reverse();
        const names = descendingOrder.map((l) => l.addressField);
        const index = names.indexOf(fieldName);
        const parentFields = names.slice(index + 1);

        // eslint-disable-next-line no-console
        console.log('[useAddressFields] Hierarchy info:', {
          descendingOrder: names,
          fieldName,
          index,
          parentFields,
        });

        let parent: AddressHierarchyItem | undefined = selectedItem.parent;
        parentFields.forEach((parentField) => {
          // eslint-disable-next-line no-console
          console.log('[useAddressFields] Processing parent field:', {
            parentField,
            hasParent: !!parent,
            parentName: parent?.name,
          });

          if (parent?.name) {
            const currentParent = parent; // Capture current parent before reassigning
            // eslint-disable-next-line no-console
            console.log(
              `[useAddressFields] Populating ${parentField} with:`,
              currentParent.name,
            );

            // Use userGeneratedId if available, otherwise use name
            const parentValue =
              currentParent.userGeneratedId ?? currentParent.name;

            setAddress((prev) => ({
              ...prev,
              [parentField]: parentValue,
            }));
            setSelectedMetadata((prev) => ({
              ...prev,
              [parentField]: {
                uuid: currentParent.uuid,
                userGeneratedId: currentParent.userGeneratedId,
                value: parentValue,
              },
            }));
            parent = parent.parent;
          }
        });
        // eslint-disable-next-line no-console
        console.log('[useAddressFields] Auto-population complete');
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
