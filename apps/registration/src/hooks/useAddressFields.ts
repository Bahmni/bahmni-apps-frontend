import { useState, useMemo, useCallback, useEffect } from 'react';

export interface AddressLevel {
  addressField: string;
  name: string;
  required: boolean;
  isStrictEntry?: boolean;
}

export interface AddressData {
  [key: string]: string | null;
}

export interface AddressHierarchyConfig {
  showAddressFieldsTopDown: boolean;
  strictAutocompleteFromLevel?: string;
}

export interface SelectedAddressMetadata {
  [fieldName: string]: {
    uuid?: string;
    userGeneratedId?: string;
    value: string | null;
  };
}

export interface AddressHierarchyItem {
  name: string;
  uuid?: string;
  userGeneratedId?: string;
  parent?: AddressHierarchyItem | undefined;
}

export function useAddressFields(
  addressLevels: AddressLevel[],
  config: AddressHierarchyConfig,
  initialAddress?: AddressData,
) {
  const [address, setAddress] = useState<AddressData>({});
  const [selectedMetadata, setSelectedMetadata] =
    useState<SelectedAddressMetadata>({});

  useEffect(() => {
    if (initialAddress && Object.keys(initialAddress).length > 0) {
      setAddress(initialAddress);

      const initialMetadata: SelectedAddressMetadata = {};
      Object.keys(initialAddress).forEach((fieldName) => {
        const fieldValue = initialAddress[fieldName];
        if (fieldValue) {
          initialMetadata[fieldName] = {
            uuid: undefined,
            userGeneratedId: fieldValue,
            value: fieldValue,
          };
        }
      });

      if (Object.keys(initialMetadata).length > 0) {
        setSelectedMetadata(initialMetadata);
      }
    }
  }, [initialAddress]);

  const displayLevels = useMemo(() => {
    if (config.showAddressFieldsTopDown) {
      return addressLevels;
    } else {
      return [...addressLevels].reverse();
    }
  }, [addressLevels, config.showAddressFieldsTopDown]);

  const levelsWithStrictEntry = useMemo(() => {
    if (!config.strictAutocompleteFromLevel) {
      return addressLevels.map((level) => ({
        ...level,
        isStrictEntry: false,
      }));
    }

    const levels = [...addressLevels].reverse();
    let foundConfiguredLevel = false;

    const processed = levels.map((level) => {
      if (config.strictAutocompleteFromLevel === level.addressField) {
        foundConfiguredLevel = true;
      }
      return {
        ...level,
        isStrictEntry: foundConfiguredLevel,
      };
    });

    return processed.reverse();
  }, [addressLevels, config.strictAutocompleteFromLevel]);

  const levelChunks = useMemo(() => {
    const chunks: AddressLevel[][] = [];
    for (let i = 0; i < displayLevels.length; i += 2) {
      chunks.push(displayLevels.slice(i, i + 2));
    }
    return chunks;
  }, [displayLevels]);

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

  const isFieldReadOnly = useCallback(
    (level: AddressLevel): boolean => {
      if (!config.showAddressFieldsTopDown) {
        return false;
      }

      if (!level.isStrictEntry) {
        return false;
      }

      const parentField = findParentField(level.addressField);
      if (!parentField) {
        return false;
      }

      const parentValue = address[parentField];
      return !parentValue;
    },
    [config.showAddressFieldsTopDown, address, findParentField],
  );

  const getDescendantFields = useCallback(
    (fieldName: string): string[] => {
      const descendingOrder = [...levelsWithStrictEntry].reverse();
      const names = descendingOrder.map((l) => l.addressField);
      const index = names.indexOf(fieldName);
      return names.slice(0, index);
    },
    [levelsWithStrictEntry],
  );

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

  const handleFieldSelect = useCallback(
    (fieldName: string, selectedItem: AddressHierarchyItem) => {
      const fieldValue = selectedItem.userGeneratedId ?? selectedItem.name;
      setAddress((prev) => ({ ...prev, [fieldName]: fieldValue }));

      setSelectedMetadata((prev) => ({
        ...prev,
        [fieldName]: {
          uuid: selectedItem.uuid,
          userGeneratedId: selectedItem.userGeneratedId,
          value: fieldValue,
        },
      }));

      if (selectedItem.parent) {
        const descendingOrder = [...levelsWithStrictEntry].reverse();
        const names = descendingOrder.map((l) => l.addressField);
        const index = names.indexOf(fieldName);
        const parentFields = names.slice(index + 1);

        let parent: AddressHierarchyItem | undefined = selectedItem.parent;
        parentFields.forEach((parentField) => {
          if (parent?.name) {
            const currentParent = parent;

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
      }
    },
    [levelsWithStrictEntry],
  );

  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    setAddress((prev) => ({ ...prev, [fieldName]: value }));

    setSelectedMetadata((prev) => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], value: null },
    }));
  }, []);

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

  const resetAddress = useCallback(() => {
    setAddress({});
    setSelectedMetadata({});
  }, []);

  const setAddressData = useCallback((newAddress: AddressData) => {
    setAddress(newAddress);
  }, []);

  return {
    address,
    selectedMetadata,

    displayLevels,
    levelChunks,
    levelsWithStrictEntry,

    isFieldReadOnly,
    handleFieldSelect,
    handleFieldChange,
    getParentUuid,
    clearChildFields,
    resetAddress,
    setAddressData,
  };
}
