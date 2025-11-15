import { ComboBox } from '@bahmni-frontend/bahmni-design-system';
import type { AddressHierarchyEntry } from '@bahmni-frontend/bahmni-services';
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
  // Memoize the itemToString function
  const itemToString = useMemo(
    () => (item: AddressHierarchyEntry | null) => (item ? item.name : ''),
    [],
  );

  return (
    <div key={fieldName} className={styles.col}>
      <ComboBox
        id={fieldName}
        titleText={level.name}
        placeholder={level.name}
        items={suggestions}
        itemToString={itemToString}
        selectedItem={selectedItem}
        disabled={isDisabled}
        invalid={!!error}
        invalidText={error}
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
