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
  const itemToString = useMemo(
    () => (item: AddressHierarchyEntry | null) => {
      if (!item) return '';
      return item.userGeneratedId ?? item.name;
    },
    [],
  );

  const itemToElement = useMemo(
    () => (item: AddressHierarchyEntry) => {
      if (!item) return '';

      const mainValue = item.userGeneratedId ?? item.name;

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
