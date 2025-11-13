import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  getAddressHierarchyEntries,
  type AddressHierarchyEntry,
  type PatientAddress,
} from '@bahmni-frontend/bahmni-services';
import { useQueries } from '@tanstack/react-query';
import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AddressHierarchyItem } from '../../../hooks/useAddressFields';
import { useAddressFieldsWithConfig } from '../../../hooks/useAddressFieldsWithConfig';
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

  // Track search queries for autocomplete fields dynamically
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>(
    {},
  );

  // Track which fields show suggestions dynamically
  const [showSuggestions, setShowSuggestions] = useState<
    Record<string, boolean>
  >({});

  // Debounce timers
  const debounceTimers = useRef<Record<string, number | null>>({});

  // Track which fields are currently focused
  const focusedFields = useRef<Record<string, boolean>>({});

  // Get list of fields that need autocomplete (not free text fields)
  const autocompleteFields = useMemo(() => {
    return levelsWithStrictEntry
      .map((level) => level.addressField)
      .filter((field) => !FREE_TEXT_FIELDS.includes(field));
  }, [levelsWithStrictEntry]);

  // Get parent field UUID for hierarchical filtering
  // This is used to filter child field options based on parent selection
  const getParentUuid = useCallback(
    (fieldName: string): string | undefined => {
      const fieldIndex = displayLevels.findIndex(
        (level) => level.addressField === fieldName,
      );
      if (fieldIndex <= 0) return undefined; // No parent for first field

      // Get the parent field (previous field in display order)
      const parentField = displayLevels[fieldIndex - 1];
      return selectedMetadata[parentField.addressField]?.uuid;
    },
    [displayLevels, selectedMetadata],
  );

  // Dynamic TanStack queries for all autocomplete fields
  const suggestionQueries = useQueries({
    queries: autocompleteFields.map((fieldName) => ({
      queryKey: [
        'addressHierarchy',
        fieldName,
        searchQueries[fieldName],
        getParentUuid(fieldName), // Include parent UUID in query key
      ],
      queryFn: () =>
        getAddressHierarchyEntries(
          fieldName,
          searchQueries[fieldName],
          20, // default limit
          getParentUuid(fieldName), // Pass parent UUID for hierarchical filtering
        ),
      enabled: (searchQueries[fieldName]?.length ?? 0) >= 2,
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Map query results to field names - using a ref to avoid dependency issues
  const suggestionsRef = useRef<Record<string, AddressHierarchyEntry[]>>({});

  // Update the ref without triggering re-renders
  autocompleteFields.forEach((fieldName, index) => {
    suggestionsRef.current[fieldName] = suggestionQueries[index]?.data ?? [];
  });

  // Also keep the memoized version for rendering
  const suggestions = useMemo(() => {
    const result: Record<string, AddressHierarchyEntry[]> = {};
    autocompleteFields.forEach((fieldName, index) => {
      result[fieldName] = suggestionQueries[index]?.data ?? [];
    });
    return result;
  }, [autocompleteFields, suggestionQueries]);

  // Debounced search handler
  const debouncedSearchAddress = useCallback(
    (field: string, searchText: string) => {
      if (debounceTimers.current[field]) {
        clearTimeout(debounceTimers.current[field]!);
      }

      debounceTimers.current[field] = window.setTimeout(() => {
        setSearchQueries((prev) => ({ ...prev, [field]: searchText }));
      }, 300);
    },
    [],
  );

  // Handle input change for autocomplete fields
  const handleAddressInputChange = useCallback(
    (field: string, value: string) => {
      handleFieldChange(field, value);

      // Only debounce search for autocomplete fields
      if (autocompleteFields.includes(field)) {
        debouncedSearchAddress(field, value);

        // Show suggestions if we have cached data and user is typing (use ref to avoid dependency)
        if (value.length >= 2) {
          // Check if we have suggestions using setTimeout to wait for query to complete
          setTimeout(() => {
            if (suggestionsRef.current[field]?.length > 0) {
              setShowSuggestions((prev) => ({ ...prev, [field]: true }));
            }
          }, 350); // Slightly longer than debounce time
        }
      }

      // Clear validation error when typing
      setAddressErrors((prev) => ({ ...prev, [field]: '' }));

      // Hide suggestions if field is cleared
      if (!value) {
        setShowSuggestions((prev) => ({ ...prev, [field]: false }));
      }
    },
    [handleFieldChange, debouncedSearchAddress, autocompleteFields],
  );

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (field: string, entry: AddressHierarchyEntry) => {
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
      setShowSuggestions((prev) => ({ ...prev, [field]: false }));
      setAddressErrors((prev) => ({ ...prev, [field]: '' }));
    },
    [handleFieldSelect],
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

  // Render autocomplete field with suggestions
  const renderAutocompleteField = useCallback(
    (fieldName: string) => {
      const level = levelsWithStrictEntry.find(
        (l) => l.addressField === fieldName,
      );
      if (!level) return null;

      const isDisabled = isFieldReadOnly(level);
      const fieldValue = address[fieldName] ?? '';
      const error = addressErrors[fieldName];
      const fieldSuggestions = suggestions[fieldName] ?? [];

      return (
        <div key={fieldName} className={styles.col}>
          <div className={styles.addressFieldWrapper}>
            <TextInput
              id={fieldName}
              labelText={level.name}
              placeholder={level.name}
              value={fieldValue}
              invalid={!!error}
              invalidText={error}
              disabled={isDisabled}
              onChange={(e) =>
                handleAddressInputChange(fieldName, e.target.value)
              }
              onBlur={() => {
                focusedFields.current[fieldName] = false;
                setTimeout(() => {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    [fieldName]: false,
                  }));
                }, 200);
              }}
              onFocus={() => {
                focusedFields.current[fieldName] = true;
                if (fieldSuggestions.length > 0) {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    [fieldName]: true,
                  }));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || e.key === 'Enter') {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    [fieldName]: false,
                  }));
                }
              }}
            />

            {showSuggestions[fieldName] && fieldSuggestions.length > 0 && (
              <div
                className={styles.suggestionsList}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur on clicking suggestions container
              >
                {fieldSuggestions.map((entry) => (
                  <div
                    key={entry.userGeneratedId ?? entry.uuid}
                    className={styles.suggestionItem}
                    onClick={() => {
                      handleSuggestionSelect(fieldName, entry);
                    }}
                  >
                    <div className={styles.suggestionName}>{entry.name}</div>
                    {entry.parent && (
                      <div className={styles.suggestionParent}>
                        {entry.parent.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    },
    [
      levelsWithStrictEntry,
      isFieldReadOnly,
      address,
      addressErrors,
      suggestions,
      showSuggestions,
      handleAddressInputChange,
      handleSuggestionSelect,
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
