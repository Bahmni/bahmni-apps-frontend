import { TextInput } from '@bahmni/design-system';
import {
  useTranslation,
  type AddressHierarchyEntry,
  type PatientAddress,
} from '@bahmni/services';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AddressData,
  AddressHierarchyItem,
} from '../../../hooks/useAddressFields';
import { useAddressFieldsWithConfig } from '../../../hooks/useAddressFieldsWithConfig';
import { useAddressSuggestions } from '../../../hooks/useAddressSuggestions';
import { AddressAutocompleteField } from './AddressAutocompleteField';
import styles from './styles/index.module.scss';

export type AddressInfoRef = {
  validate: () => boolean;
  getData: () => PatientAddress;
};

interface AddressInfoProps {
  initialData?: AddressData;
  ref?: React.Ref<AddressInfoRef>;
}

export const AddressInfo = ({ initialData, ref }: AddressInfoProps) => {
  const { t } = useTranslation();

  const {
    address,
    displayLevels,
    handleFieldSelect,
    handleFieldChange,
    levelsWithStrictEntry,
    isFieldReadOnly,
    selectedMetadata,
    isLoadingLevels,
    getTranslationKey,
    clearChildFields,
  } = useAddressFieldsWithConfig(initialData);

  const [addressErrors, setAddressErrors] = useState<Record<string, string>>(
    {},
  );

  const autoPopulatingFieldsRef = useRef<Set<string>>(new Set());
  const isInitializingRef = useRef(false);

  const hierarchyFieldNames = useMemo(() => {
    const hierarchyFields = new Set<string>();

    levelsWithStrictEntry.forEach((level) => {
      if (level.isStrictEntry === true) {
        hierarchyFields.add(level.addressField);
      }
    });

    return hierarchyFields;
  }, [levelsWithStrictEntry]);

  const autocompleteFields = useMemo(() => {
    return levelsWithStrictEntry
      .map((level) => level.addressField)
      .filter((field) => hierarchyFieldNames.has(field));
  }, [levelsWithStrictEntry, hierarchyFieldNames]);

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

  useEffect(() => {
    if (!initialData || levelsWithStrictEntry.length === 0) return;

    isInitializingRef.current = true;

    const initialSelectedItems: Record<string, AddressHierarchyEntry | null> =
      {};

    autocompleteFields.forEach((fieldName) => {
      const fieldValue = initialData[fieldName];
      if (fieldValue) {
        initialSelectedItems[fieldName] = {
          name: fieldValue,
          uuid: '',
          userGeneratedId: fieldValue,
        };
      }
    });

    if (Object.keys(initialSelectedItems).length > 0) {
      setSelectedItems(initialSelectedItems);
    }

    setTimeout(() => {
      isInitializingRef.current = false;
    }, 0);
  }, [
    initialData,
    levelsWithStrictEntry.length,
    autocompleteFields,
    setSelectedItems,
  ]);

  const handleAddressInputChange = useCallback(
    (field: string, value: string) => {
      const level = levelsWithStrictEntry.find((l) => l.addressField === field);

      if (!value) {
        setSelectedItems((prev) => ({ ...prev, [field]: null }));
        handleFieldChange(field, value);
        clearChildSuggestions(field);
        clearChildFields(field);
      }

      if (autocompleteFields.includes(field)) {
        debouncedSearchAddress(field, value);
        unmarkFieldAsCleared(field);
      }
      if (level && !level.isStrictEntry) {
        handleFieldChange(field, value);
      }
      setAddressErrors((prev) => ({ ...prev, [field]: '' }));
    },
    [
      debouncedSearchAddress,
      autocompleteFields,
      unmarkFieldAsCleared,
      levelsWithStrictEntry,
      handleFieldChange,
      clearChildSuggestions,
      clearChildFields,
      setSelectedItems,
    ],
  );

  const handleSuggestionSelect = useCallback(
    (field: string, entry: AddressHierarchyEntry) => {
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
      if (!item) return;

      handleFieldSelect(field, item);

      const entriesToUpdate: Record<string, AddressHierarchyEntry> = {
        [field]: entry,
      };

      if (item.parent) {
        const fieldIndex = levelsWithStrictEntry.findIndex(
          (l) => l.addressField === field,
        );
        if (fieldIndex >= 0) {
          let currentParent: AddressHierarchyItem | undefined = item.parent;
          let currentFieldIndex = fieldIndex - 1;

          while (currentParent && currentFieldIndex >= 0) {
            const parentFieldName =
              levelsWithStrictEntry[currentFieldIndex].addressField;

            if (!currentParent.uuid) {
              currentParent = currentParent.parent;
              currentFieldIndex--;
              continue;
            }

            const parentEntry: AddressHierarchyEntry = {
              uuid: currentParent.uuid,
              name: currentParent.name,
              userGeneratedId: currentParent.userGeneratedId ?? null,
              parent: currentParent.parent?.uuid
                ? {
                    uuid: currentParent.parent.uuid,
                    name: currentParent.parent.name,
                    userGeneratedId:
                      currentParent.parent.userGeneratedId ?? null,
                    parent: undefined,
                  }
                : undefined,
            };

            entriesToUpdate[parentFieldName] = parentEntry;

            autoPopulatingFieldsRef.current.add(parentFieldName);

            currentParent = currentParent.parent;
            currentFieldIndex--;
          }
        }
      }

      setSelectedItems((prev) => ({
        ...prev,
        ...entriesToUpdate,
      }));

      if (item.parent) {
        setTimeout(() => {
          autoPopulatingFieldsRef.current.clear();
        }, 100);
      }

      setAddressErrors((prev) => ({ ...prev, [field]: '' }));

      if (!isInitializingRef.current) {
        clearChildSuggestions(field);
      }
    },
    [
      handleFieldSelect,
      clearChildSuggestions,
      setSelectedItems,
      levelsWithStrictEntry,
    ],
  );

  const validate = useCallback((): boolean => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    levelsWithStrictEntry.forEach((level) => {
      if (level.isStrictEntry && address[level.addressField]) {
        const metadata = selectedMetadata[level.addressField];

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

  const getData = useCallback((): PatientAddress => {
    const result: PatientAddress = {};

    Object.keys(address).forEach((key) => {
      result[key as keyof PatientAddress] = address[key] ?? '';
    });

    return result;
  }, [address]);

  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  const handleSelectionChange = useCallback(
    (field: string, entry: AddressHierarchyEntry | null) => {
      if (autoPopulatingFieldsRef.current.has(field)) {
        autoPopulatingFieldsRef.current.delete(field);
        return;
      }

      if (entry) {
        handleSuggestionSelect(field, entry);
      } else {
        setSelectedItems((prev) => ({ ...prev, [field]: null }));
        handleFieldChange(field, '');
        clearChildSuggestions(field);
      }
    },
    [
      handleSuggestionSelect,
      setSelectedItems,
      handleFieldChange,
      clearChildSuggestions,
    ],
  );

  const renderAutocompleteField = useCallback(
    (fieldName: string) => {
      const level = levelsWithStrictEntry.find(
        (l) => l.addressField === fieldName,
      );
      if (!level) return null;

      const isDisabled = isFieldReadOnly(level);
      const error = addressErrors[fieldName];
      const fieldSuggestions = suggestions[fieldName] ?? [];

      const fieldIndex = levelsWithStrictEntry.findIndex(
        (l) => l.addressField === fieldName,
      );
      const parentField =
        fieldIndex > 0
          ? levelsWithStrictEntry[fieldIndex - 1].addressField
          : null;
      const parentValue = parentField ? address[parentField] : null;
      const componentKey = `${fieldName}-${parentValue ?? 'empty'}`;

      return (
        <AddressAutocompleteField
          key={componentKey}
          fieldName={fieldName}
          level={level}
          isDisabled={isDisabled}
          error={error}
          suggestions={fieldSuggestions}
          selectedItem={selectedItems[fieldName] ?? null}
          onSelectionChange={handleSelectionChange}
          onInputChange={handleAddressInputChange}
          translationKey={getTranslationKey(level.addressField)}
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
      getTranslationKey,
      address,
    ],
  );

  const renderFreeTextField = useCallback(
    (fieldName: string) => {
      const level = levelsWithStrictEntry.find(
        (l) => l.addressField === fieldName,
      );
      if (!level) return null;

      const isDisabled = isFieldReadOnly(level);
      const fieldValue = address[fieldName] ?? '';
      const translationKey = getTranslationKey(level.addressField);
      const translatedLabel = translationKey ? t(translationKey) : level.name;

      return (
        <div
          key={fieldName}
          className={styles.col}
          data-testid={`address-free-text-field-${fieldName}`}
        >
          <TextInput
            id={fieldName}
            data-testid={`address-free-text-input-${fieldName}`}
            labelText={
              level.required ? `${translatedLabel} *` : translatedLabel
            }
            placeholder={translatedLabel}
            value={fieldValue}
            disabled={isDisabled}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          />
        </div>
      );
    },
    [
      levelsWithStrictEntry,
      isFieldReadOnly,
      address,
      handleFieldChange,
      t,
      getTranslationKey,
    ],
  );

  if (isLoadingLevels) {
    return (
      <div
        className={styles.formSection}
        data-testid="address-info-section-loading"
      >
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
    <div className={styles.formSection} data-testid="address-info-section">
      <span className={styles.sectionTitle} data-testid="address-info-title">
        {t('CREATE_PATIENT_SECTION_ADDRESS_INFO')}
      </span>

      <div className={styles.row} data-testid="address-info-fields-row">
        {displayLevels.map((level) => {
          const fieldName = level.addressField;

          if (hierarchyFieldNames.has(fieldName)) {
            return renderAutocompleteField(fieldName);
          } else {
            return renderFreeTextField(fieldName);
          }
        })}
      </div>
    </div>
  );
};

AddressInfo.displayName = 'AddressInfo';

export default AddressInfo;
