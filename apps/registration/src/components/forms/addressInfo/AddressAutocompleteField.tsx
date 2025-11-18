import { ComboBox } from '@bahmni/design-system';
import type { AddressHierarchyEntry } from '@bahmni/services';
import { useMemo } from 'react';
import type { AddressLevel } from '../../../hooks/useAddressFields';
import styles from './styles/index.module.scss';

interface AddressAutocompleteFieldProps {
  fieldName: string;
  level: AddressLevel;
  isDisabled: boolean;
  error?: string;
  suggestions: AddressHierarchyEntry[];
  selectedItem: AddressHierarchyEntry | null;
  onSelectionChange: (
    field: string,
    entry: AddressHierarchyEntry | null,
  ) => void;
  onInputChange: (field: string, value: string) => void;
}

/**
 * Autocomplete field component for address hierarchy fields
 * Uses ComboBox with dynamic suggestions from backend API
 */
export const AddressAutocompleteField = ({
  fieldName,
  level,
  isDisabled,
  error,
  suggestions,
  selectedItem,
  onSelectionChange,
  onInputChange,
}: AddressAutocompleteFieldProps) => {
  // Memoize the itemToString function for input display
  // Only show the main value (not parent) in the selected input field
  const itemToString = useMemo(
    () => (item: AddressHierarchyEntry | null) => {
      if (!item) return '';
      // Use userGeneratedId if available (e.g., postal codes), otherwise use name
      return item.userGeneratedId ?? item.name;
    },
    [],
  );

  // Memoize the itemToElement function for dropdown display
  // Display format: "value, parent" (e.g., "110001, New Delhi" for postal codes)
  const itemToElement = useMemo(
    () => (item: AddressHierarchyEntry) => {
      if (!item) return '';

      // Use userGeneratedId if available (e.g., postal codes), otherwise use name
      const mainValue = item.userGeneratedId ?? item.name;

      // Append parent name if available for better context in dropdown
      if (item.parent?.name) {
        return `${mainValue}, ${item.parent.name}`;
      }

      return mainValue;
    },
    [],
  );

  return (
    <div key={fieldName} className={styles.col}>
      <ComboBox
        id={fieldName}
        titleText={level.required ? `${level.name} *` : level.name}
        placeholder={level.name}
        items={suggestions}
        itemToString={itemToString}
        itemToElement={itemToElement}
        selectedItem={selectedItem}
        disabled={isDisabled}
        invalid={!!error}
        invalidText={error}
        allowCustomValue={!level.isStrictEntry}
        onChange={(data) => {
          if (data.selectedItem) {
            onSelectionChange(fieldName, data.selectedItem);
          } else {
            // Clear selection if user clears the input
            onSelectionChange(fieldName, null);
          }
        }}
        onInputChange={(inputText) => {
          onInputChange(fieldName, inputText);
        }}
      />
    </div>
  );
};

AddressAutocompleteField.displayName = 'AddressAutocompleteField';

export default AddressAutocompleteField;
