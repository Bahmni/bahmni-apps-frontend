import { ComboBox } from '@bahmni/design-system';
import { useTranslation, type AddressHierarchyEntry } from '@bahmni/services';
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
  translationKey?: string;
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
  translationKey,
}: AddressAutocompleteFieldProps) => {
  const { t } = useTranslation();

  const translatedLabel = useMemo(() => {
    return translationKey ? t(translationKey) : level.name;
  }, [t, translationKey, level.name]);
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
    <div
      key={fieldName}
      className={styles.col}
      data-testid={`address-autocomplete-field-${fieldName}`}
    >
      <ComboBox
        id={fieldName}
        data-testid={`address-autocomplete-combobox-${fieldName}`}
        titleText={level.required ? `${translatedLabel} *` : translatedLabel}
        placeholder={translatedLabel}
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
