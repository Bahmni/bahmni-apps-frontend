import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  type AddressHierarchyEntry,
  type PatientAddress,
} from '@bahmni-frontend/bahmni-services';
import { useCallback, useImperativeHandle, useMemo, useState } from 'react';
import type { AddressHierarchyItem } from '../../../hooks/useAddressFields';
import { useAddressFieldsWithConfig } from '../../../hooks/useAddressFieldsWithConfig';
import { useAddressSuggestions } from '../../../hooks/useAddressSuggestions';
import { AddressAutocompleteField } from './AddressAutocompleteField';
import styles from './styles/index.module.scss';

export type AddressInfoRef = {
  validate: () => boolean;
  getData: () => PatientAddress;
};

interface AddressInfoProps {
  ref?: React.Ref<AddressInfoRef>;
}

// Fields that don't need autocomplete (free text fields)
const FREE_TEXT_FIELDS = ['address1', 'address2', 'cityVillage'];

export const AddressInfo = ({ ref }: AddressInfoProps) => {
  const { t } = useTranslation();

  // Use the enhanced hook that fetches address levels dynamically
  const {
    address,
    displayLevels,
    handleFieldSelect,
    handleFieldChange,
    levelsWithStrictEntry,
    isFieldReadOnly,
    selectedMetadata,
    isLoadingLevels,
  } = useAddressFieldsWithConfig();

  // Track validation errors dynamically
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>(
    {},
  );

  // Get list of fields that need autocomplete (not free text fields)
  const autocompleteFields = useMemo(() => {
    return levelsWithStrictEntry
      .map((level) => level.addressField)
      .filter((field) => !FREE_TEXT_FIELDS.includes(field));
  }, [levelsWithStrictEntry]);

  // Use custom hook for suggestion management
  const {
    suggestions,
    selectedItems,
    setSelectedItems,
    debouncedSearchAddress,
    clearChildSuggestions,
    unmarkFieldAsCleared,
  } = useAddressSuggestions(
    autocompleteFields,
    levelsWithStrictEntry,
    selectedMetadata,
  );

  // Handle input change for autocomplete fields (ComboBox typing)
  const handleAddressInputChange = useCallback(
    (field: string, value: string) => {
      // For ComboBox fields, only trigger search - don't update address state yet
      // The address will be updated when user selects from dropdown via onChange
      if (autocompleteFields.includes(field)) {
        debouncedSearchAddress(field, value);
        // Un-mark this field as cleared since user is typing fresh query
        unmarkFieldAsCleared(field);
      }

      // Clear validation error when typing
      setAddressErrors((prev) => ({ ...prev, [field]: '' }));
    },
    [debouncedSearchAddress, autocompleteFields, unmarkFieldAsCleared],
  );

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (field: string, entry: AddressHierarchyEntry) => {
      // Store the selected item for ComboBox
      setSelectedItems((prev) => ({ ...prev, [field]: entry }));

      // Convert AddressHierarchyEntry to AddressHierarchyItem recursively
      const convertToItem = (
        entry: AddressHierarchyEntry | null | undefined,
      ): AddressHierarchyItem | undefined => {
        if (!entry) return undefined;

        return {
          name: entry.name,
          uuid: entry.uuid,
          userGeneratedId: entry.userGeneratedId ?? undefined,
          parent: entry.parent ? convertToItem(entry.parent) : undefined,
        };
      };

      const item = convertToItem(entry);
      if (!item) return; // Safety check - should not happen with valid entry

      handleFieldSelect(field, item);
      setAddressErrors((prev) => ({ ...prev, [field]: '' }));

      // Clear search queries and suggestions for child fields
      // This ensures child field suggestions are filtered by the new parent selection
      clearChildSuggestions(field);
    },
    [handleFieldSelect, clearChildSuggestions],
  );

  // Validate that strict entry fields were selected from dropdown
  const validate = useCallback((): boolean => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    levelsWithStrictEntry.forEach((level) => {
      if (level.isStrictEntry && address[level.addressField]) {
        const metadata = selectedMetadata[level.addressField];

        // Check if value exists but wasn't selected from dropdown (no metadata)
        if (!metadata?.uuid && !metadata?.userGeneratedId) {
          newErrors[level.addressField] =
            t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN') ??
            'Select input from dropdown';
          isValid = false;
        }
      }
    });

    setAddressErrors(newErrors);
    return isValid;
  }, [levelsWithStrictEntry, address, selectedMetadata, t]);

  // Get data for submission - dynamically build the address object
  const getData = useCallback((): PatientAddress => {
    const result: PatientAddress = {};

    // Add all fields dynamically from the address object
    Object.keys(address).forEach((key) => {
      if (address[key]) {
        result[key as keyof PatientAddress] = address[key]!;
      }
    });

    return result;
  }, [address]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  // Handle selection change for autocomplete fields
  const handleSelectionChange = useCallback(
    (field: string, entry: AddressHierarchyEntry | null) => {
      if (entry) {
        handleSuggestionSelect(field, entry);
      } else {
        // Clear selection if user clears the input
        setSelectedItems((prev) => ({ ...prev, [field]: null }));
      }
    },
    [handleSuggestionSelect, setSelectedItems],
  );

  // Render autocomplete field with suggestions using ComboBox
  const renderAutocompleteField = useCallback(
    (fieldName: string) => {
      const level = levelsWithStrictEntry.find(
        (l) => l.addressField === fieldName,
      );
      if (!level) return null;

      const isDisabled = isFieldReadOnly(level);
      const error = addressErrors[fieldName];
      const fieldSuggestions = suggestions[fieldName] ?? [];

      return (
        <AddressAutocompleteField
          key={fieldName}
          fieldName={fieldName}
          level={level}
          isDisabled={isDisabled}
          error={error}
          suggestions={fieldSuggestions}
          selectedItem={selectedItems[fieldName] ?? null}
          onSelectionChange={handleSelectionChange}
          onInputChange={handleAddressInputChange}
        />
      );
    },
    [
      levelsWithStrictEntry,
      isFieldReadOnly,
      addressErrors,
      suggestions,
      selectedItems,
      handleSelectionChange,
      handleAddressInputChange,
    ],
  );

  // Render free text field (no autocomplete)
  const renderFreeTextField = useCallback(
    (fieldName: string) => {
      const level = levelsWithStrictEntry.find(
        (l) => l.addressField === fieldName,
      );
      if (!level) return null;

      const isDisabled = isFieldReadOnly(level);
      const fieldValue = address[fieldName] ?? '';

      return (
        <div key={fieldName} className={styles.col}>
          <TextInput
            id={fieldName}
            labelText={level.name}
            placeholder={level.name}
            value={fieldValue}
            disabled={isDisabled}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          />
        </div>
      );
    },
    [levelsWithStrictEntry, isFieldReadOnly, address, handleFieldChange],
  );

  // Show loading state while fetching address levels
  if (isLoadingLevels) {
    return (
      <div className={styles.formSection}>
        <span className={styles.sectionTitle}>
          {t('CREATE_PATIENT_SECTION_ADDRESS_INFO')}
        </span>
        <div className={styles.row}>
          <div className={styles.col}>Loading address fields...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formSection}>
      <span className={styles.sectionTitle}>
        {t('CREATE_PATIENT_SECTION_ADDRESS_INFO')}
      </span>

      <div className={styles.row}>
        {/* Render all fields dynamically based on displayLevels from backend */}
        {displayLevels.map((level) => {
          const fieldName = level.addressField;

          // Check if this field needs autocomplete or is free text
          if (FREE_TEXT_FIELDS.includes(fieldName)) {
            return renderFreeTextField(fieldName);
          } else {
            return renderAutocompleteField(fieldName);
          }
        })}
      </div>
    </div>
  );
};

AddressInfo.displayName = 'AddressInfo';

export default AddressInfo;
