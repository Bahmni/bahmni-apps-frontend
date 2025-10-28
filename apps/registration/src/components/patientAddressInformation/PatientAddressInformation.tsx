import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  getAddressHierarchyEntries,
  type AddressHierarchyEntry,
} from '@bahmni-frontend/bahmni-services';
import { useState, useCallback } from 'react';
import styles from '../../pages/createPatientPage/styles/index.module.scss';

export interface AddressData {
  houseNumber: string;
  locality: string;
  district: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AddressErrors {
  district: string;
  state: string;
  pincode: string;
}

interface AddressInformationProps {
  formData: AddressData;
  addressErrors: AddressErrors;
  onInputChange: (field: string, value: string) => void;
  onAddressErrorsChange: (errors: AddressErrors) => void;
  getAddressSelectedFromDropdown?: (
    getter: () => {
      district: boolean;
      state: boolean;
      pincode: boolean;
    },
  ) => void;
}

export const PatientAddressInformation: React.FC<AddressInformationProps> = ({
  formData,
  addressErrors,
  onInputChange,
  onAddressErrorsChange,
  getAddressSelectedFromDropdown,
}) => {
  const { t } = useTranslation();

  // Track if address fields were selected from dropdown
  const [addressSelectedFromDropdown, setAddressSelectedFromDropdown] =
    useState({
      district: false,
      state: false,
      pincode: false,
    });

  // Expose getter function to parent for validation
  if (getAddressSelectedFromDropdown) {
    getAddressSelectedFromDropdown(() => addressSelectedFromDropdown);
  }

  // Handle dropdown selection tracking
  const handleAddressSelectedFromDropdownChange = useCallback(
    (field: string, value: boolean) => {
      setAddressSelectedFromDropdown((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  // Address hierarchy state (only for district, state, and pincode)
  const [suggestions, setSuggestions] = useState({
    district: [] as AddressHierarchyEntry[],
    state: [] as AddressHierarchyEntry[],
    pincode: [] as AddressHierarchyEntry[],
  });

  const [showSuggestions, setShowSuggestions] = useState({
    district: false,
    state: false,
    pincode: false,
  });

  const debouncedSearchAddress = useCallback(
    (field: string, searchText: string, addressField: string) => {
      const timeoutId = setTimeout(async () => {
        if (!searchText || searchText.length < 2) {
          setSuggestions((prev) => ({ ...prev, [field]: [] }));
          setShowSuggestions((prev) => ({ ...prev, [field]: false }));
          return;
        }

        try {
          const results = await getAddressHierarchyEntries(
            addressField,
            searchText,
          );
          setSuggestions((prev) => ({ ...prev, [field]: results }));
          setShowSuggestions((prev) => ({
            ...prev,
            [field]: results.length > 0,
          }));
        } catch {
          setSuggestions((prev) => ({ ...prev, [field]: [] }));
          setShowSuggestions((prev) => ({ ...prev, [field]: false }));
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [],
  );

  const handleAddressInputChange = useCallback(
    (field: string, value: string, addressField: string) => {
      onInputChange(field, value);
      debouncedSearchAddress(field, value, addressField);

      // Mark field as not selected from dropdown when manually typed
      if (field === 'district' || field === 'state' || field === 'pincode') {
        handleAddressSelectedFromDropdownChange(field, false);
        // Clear error when field is empty
        if (!value) {
          onAddressErrorsChange({
            ...addressErrors,
            [field]: '',
          });
        }
      }
    },
    [
      onInputChange,
      debouncedSearchAddress,
      handleAddressSelectedFromDropdownChange,
      addressErrors,
      onAddressErrorsChange,
    ],
  );

  const handleSuggestionSelect = useCallback(
    (field: string, entry: AddressHierarchyEntry) => {
      onInputChange(field, entry.name);
      const parents: AddressHierarchyEntry[] = [];
      let currentParent = entry.parent;
      while (currentParent) {
        parents.push(currentParent);
        currentParent = currentParent.parent;
      }

      // Mark field as selected from dropdown
      if (field === 'district' || field === 'state' || field === 'pincode') {
        handleAddressSelectedFromDropdownChange(field, true);
      }

      // Prepare new errors object to clear all affected fields at once
      const newErrors = { ...addressErrors, [field]: '' };

      // Auto-populate parent fields based on the selected field and hierarchy
      if (parents.length > 0) {
        if (field === 'pincode') {
          // When pincode is selected, first parent is district
          if (parents[0]) {
            onInputChange('district', parents[0].name);
            handleAddressSelectedFromDropdownChange('district', true);
            newErrors.district = '';
          }
          // Second parent is state
          if (parents.length > 1 && parents[1]) {
            onInputChange('state', parents[1].name);
            handleAddressSelectedFromDropdownChange('state', true);
            newErrors.state = '';
          }
        } else if (field === 'district') {
          // When district is selected, first parent is state
          if (parents[0]) {
            onInputChange('state', parents[0].name);
            handleAddressSelectedFromDropdownChange('state', true);
            newErrors.state = '';
          }
        }
      }

      // Clear all errors at once
      onAddressErrorsChange(newErrors);

      setShowSuggestions((prev) => ({ ...prev, [field]: false }));
      setSuggestions((prev) => ({ ...prev, [field]: [] }));
    },
    [
      onInputChange,
      handleAddressSelectedFromDropdownChange,
      addressErrors,
      onAddressErrorsChange,
    ],
  );

  return (
    <div className={styles.formSection}>
      <span className={styles.sectionTitle}>
        {t('CREATE_PATIENT_SECTION_ADDRESS_INFO')}
      </span>
      <div className={styles.row}>
        <div className={styles.col}>
          <TextInput
            id="house-number"
            labelText={t('CREATE_PATIENT_HOUSE_NUMBER')}
            placeholder={t('CREATE_PATIENT_ADDRESS_LINE_PLACEHOLDER')}
            value={formData.houseNumber}
            onChange={(e) => onInputChange('houseNumber', e.target.value)}
          />
        </div>
        <div className={styles.col}>
          <TextInput
            id="locality"
            labelText={t('CREATE_PATIENT_LOCALITY')}
            placeholder={t('CREATE_PATIENT_LOCALITY')}
            value={formData.locality}
            onChange={(e) => onInputChange('locality', e.target.value)}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.col}>
          <div className={styles.addressFieldWrapper}>
            <TextInput
              id="district"
              labelText={t('CREATE_PATIENT_DISTRICT')}
              placeholder={t('CREATE_PATIENT_DISTRICT')}
              value={formData.district}
              invalid={!!addressErrors.district}
              invalidText={addressErrors.district}
              onChange={(e) =>
                handleAddressInputChange(
                  'district',
                  e.target.value,
                  'countyDistrict',
                )
              }
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    district: false,
                  }));
                }, 200);
              }}
              onFocus={() => {
                if (suggestions.district.length > 0) {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    district: true,
                  }));
                }
              }}
            />
            {showSuggestions.district && suggestions.district.length > 0 && (
              <div className={styles.suggestionsList}>
                {suggestions.district.map((entry) => (
                  <div
                    key={entry.userGeneratedId ?? entry.uuid}
                    className={styles.suggestionItem}
                    onClick={() => handleSuggestionSelect('district', entry)}
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
        <div className={styles.col}>
          <TextInput
            id="city"
            labelText={t('CREATE_PATIENT_CITY')}
            placeholder={t('CREATE_PATIENT_CITY')}
            value={formData.city}
            onChange={(e) => onInputChange('city', e.target.value)}
          />
        </div>
        <div className={styles.col}>
          <div className={styles.addressFieldWrapper}>
            <TextInput
              id="state"
              labelText={t('CREATE_PATIENT_STATE')}
              placeholder={t('CREATE_PATIENT_STATE')}
              value={formData.state}
              invalid={!!addressErrors.state}
              invalidText={addressErrors.state}
              onChange={(e) =>
                handleAddressInputChange(
                  'state',
                  e.target.value,
                  'stateProvince',
                )
              }
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    state: false,
                  }));
                }, 200);
              }}
              onFocus={() => {
                if (suggestions.state.length > 0) {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    state: true,
                  }));
                }
              }}
            />
            {showSuggestions.state && suggestions.state.length > 0 && (
              <div className={styles.suggestionsList}>
                {suggestions.state.map((entry) => (
                  <div
                    key={entry.userGeneratedId ?? entry.uuid}
                    className={styles.suggestionItem}
                    onClick={() => handleSuggestionSelect('state', entry)}
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
        <div className={styles.col}>
          <div className={styles.addressFieldWrapper}>
            <TextInput
              id="pincode"
              labelText={t('CREATE_PATIENT_PINCODE')}
              placeholder={t('CREATE_PATIENT_PINCODE')}
              value={formData.pincode}
              invalid={!!addressErrors.pincode}
              invalidText={addressErrors.pincode}
              onChange={(e) =>
                handleAddressInputChange(
                  'pincode',
                  e.target.value,
                  'postalCode',
                )
              }
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    pincode: false,
                  }));
                }, 200);
              }}
              onFocus={() => {
                if (suggestions.pincode.length > 0) {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    pincode: true,
                  }));
                }
              }}
            />
            {showSuggestions.pincode && suggestions.pincode.length > 0 && (
              <div className={styles.suggestionsList}>
                {suggestions.pincode.map((entry) => (
                  <div
                    key={entry.userGeneratedId ?? entry.uuid}
                    className={styles.suggestionItem}
                    onClick={() => handleSuggestionSelect('pincode', entry)}
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
      </div>
    </div>
  );
};
