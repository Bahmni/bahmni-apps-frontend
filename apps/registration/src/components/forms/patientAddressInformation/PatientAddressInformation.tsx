import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  getAddressHierarchyEntries,
  type AddressHierarchyEntry,
  type PatientAddress,
} from '@bahmni-frontend/bahmni-services';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { AddressData } from '../../../models/patient';
import type { AddressErrors } from '../../../models/validation';
import styles from './styles/index.module.scss';

export type PatientAddressInformationRef = {
  validate: () => boolean;
  getData: () => PatientAddress;
};

const initialFormData: AddressData = {
  address1: '',
  address2: '',
  countyDistrict: '',
  cityVillage: '',
  stateProvince: '',
  postalCode: '',
};

const initialErrors: AddressErrors = {
  address1: '',
  address2: '',
  countyDistrict: '',
  cityVillage: '',
  stateProvince: '',
  postalCode: '',
};

export const PatientAddressInformation = forwardRef<
  PatientAddressInformationRef,
  object
>((_props, ref) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<AddressData>(initialFormData);
  const [addressErrors, setAddressErrors] =
    useState<AddressErrors>(initialErrors);

  const [suggestions, setSuggestions] = useState({
    countyDistrict: [] as AddressHierarchyEntry[],
    stateProvince: [] as AddressHierarchyEntry[],
    postalCode: [] as AddressHierarchyEntry[],
  });

  const [showSuggestions, setShowSuggestions] = useState({
    countyDistrict: false,
    stateProvince: false,
    postalCode: false,
  });

  // Track if field value was selected from dropdown
  const [selectedFromDropdown, setSelectedFromDropdown] = useState({
    countyDistrict: false,
    stateProvince: false,
    postalCode: false,
  });

  // debounce timers per field
  const debounceTimers = useRef<Record<string, number | null>>({
    countyDistrict: null,
    stateProvince: null,
    postalCode: null,
  });

  const validate = useCallback(() => {
    const nextErrors: AddressErrors = { ...initialErrors };

    // Address fields are optional, but if they have a value, it must be from dropdown
    if (formData.countyDistrict && !selectedFromDropdown.countyDistrict) {
      nextErrors.countyDistrict =
        t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN') ??
        'Select input from dropdown';
    }

    if (formData.stateProvince && !selectedFromDropdown.stateProvince) {
      nextErrors.stateProvince =
        t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN') ??
        'Select input from dropdown';
    }

    if (formData.postalCode && !selectedFromDropdown.postalCode) {
      nextErrors.postalCode =
        t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN') ??
        'Select input from dropdown';
    }

    setAddressErrors(nextErrors);
    return Object.values(nextErrors).every((v) => !v);
  }, [formData, t, selectedFromDropdown]);

  const getData = useCallback((): PatientAddress => {
    // Return PatientAddress directly with API field names
    return {
      ...(formData.address1 && { address1: formData.address1 }),
      ...(formData.address2 && { address2: formData.address2 }),
      ...(formData.cityVillage && { cityVillage: formData.cityVillage }),
      ...(formData.countyDistrict && {
        countyDistrict: formData.countyDistrict,
      }),
      ...(formData.stateProvince && { stateProvince: formData.stateProvince }),
      ...(formData.postalCode && { postalCode: formData.postalCode }),
    };
  }, [formData]);

  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  const onInputChange = useCallback(
    (field: keyof AddressData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const debouncedSearchAddress = useCallback(
    (field: string, searchText: string, addressField: string) => {
      // clear existing timer
      const existing = debounceTimers.current[field];
      if (existing) {
        window.clearTimeout(existing);
      }

      const id = window.setTimeout(async () => {
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

      debounceTimers.current[field] = id;
    },
    [],
  );

  const handleAddressInputChange = useCallback(
    (field: keyof AddressData, value: string, addressField: string) => {
      onInputChange(field, value);
      if (
        field === 'countyDistrict' ||
        field === 'stateProvince' ||
        field === 'postalCode'
      ) {
        // Mark as not selected from dropdown when user types
        setSelectedFromDropdown((prev) => ({ ...prev, [field]: false }));
        debouncedSearchAddress(field, value, addressField);
        if (!value) {
          setAddressErrors((prev) => ({ ...prev, [field]: '' }));
        }
      }
    },
    [onInputChange, debouncedSearchAddress],
  );

  const handleSuggestionSelect = useCallback(
    (field: keyof AddressData, entry: AddressHierarchyEntry) => {
      onInputChange(field, entry.name);

      const parents: AddressHierarchyEntry[] = [];
      let current = entry.parent;
      while (current) {
        parents.push(current);
        current = current.parent;
      }

      const nextErrors = { ...addressErrors, [field]: '' };
      const nextSelectedFromDropdown = {
        ...selectedFromDropdown,
        [field]: true,
      };

      if (field === 'postalCode') {
        if (parents[0]) {
          onInputChange('countyDistrict', parents[0].name);
          nextErrors.countyDistrict = '';
          nextSelectedFromDropdown.countyDistrict = true;
        }
        if (parents[1]) {
          onInputChange('stateProvince', parents[1].name);
          nextErrors.stateProvince = '';
          nextSelectedFromDropdown.stateProvince = true;
        }
      } else if (field === 'countyDistrict') {
        if (parents[0]) {
          onInputChange('stateProvince', parents[0].name);
          nextErrors.stateProvince = '';
          nextSelectedFromDropdown.stateProvince = true;
        }
      }

      setSelectedFromDropdown(nextSelectedFromDropdown);
      setAddressErrors(nextErrors);
      setShowSuggestions((prev) => ({ ...prev, [field]: false }));
      setSuggestions((prev) => ({ ...prev, [field]: [] }));
    },
    [onInputChange, addressErrors, selectedFromDropdown],
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
            value={formData.address1}
            onChange={(e) => onInputChange('address1', e.target.value)}
          />
        </div>

        <div className={styles.col}>
          <TextInput
            id="locality"
            labelText={t('CREATE_PATIENT_LOCALITY')}
            placeholder={t('CREATE_PATIENT_LOCALITY')}
            value={formData.address2}
            onChange={(e) => onInputChange('address2', e.target.value)}
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
              value={formData.countyDistrict}
              invalid={!!addressErrors.countyDistrict}
              invalidText={addressErrors.countyDistrict}
              onChange={(e) =>
                handleAddressInputChange(
                  'countyDistrict',
                  e.target.value,
                  'countyDistrict',
                )
              }
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    countyDistrict: false,
                  }));
                }, 200);
              }}
              onFocus={() => {
                if (suggestions.countyDistrict.length > 0) {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    countyDistrict: true,
                  }));
                }
              }}
            />

            {showSuggestions.countyDistrict &&
              suggestions.countyDistrict.length > 0 && (
                <div className={styles.suggestionsList}>
                  {suggestions.countyDistrict.map((entry) => (
                    <div
                      key={entry.userGeneratedId ?? entry.uuid}
                      className={styles.suggestionItem}
                      onClick={() =>
                        handleSuggestionSelect('countyDistrict', entry)
                      }
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
            value={formData.cityVillage}
            onChange={(e) => onInputChange('cityVillage', e.target.value)}
          />
        </div>

        <div className={styles.col}>
          <div className={styles.addressFieldWrapper}>
            <TextInput
              id="state"
              labelText={t('CREATE_PATIENT_STATE')}
              placeholder={t('CREATE_PATIENT_STATE')}
              value={formData.stateProvince}
              invalid={!!addressErrors.stateProvince}
              invalidText={addressErrors.stateProvince}
              onChange={(e) =>
                handleAddressInputChange(
                  'stateProvince',
                  e.target.value,
                  'stateProvince',
                )
              }
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    stateProvince: false,
                  }));
                }, 200);
              }}
              onFocus={() => {
                if (suggestions.stateProvince.length > 0) {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    stateProvince: true,
                  }));
                }
              }}
            />

            {showSuggestions.stateProvince &&
              suggestions.stateProvince.length > 0 && (
                <div className={styles.suggestionsList}>
                  {suggestions.stateProvince.map((entry) => (
                    <div
                      key={entry.userGeneratedId ?? entry.uuid}
                      className={styles.suggestionItem}
                      onClick={() =>
                        handleSuggestionSelect('stateProvince', entry)
                      }
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
              value={formData.postalCode}
              invalid={!!addressErrors.postalCode}
              invalidText={addressErrors.postalCode}
              onChange={(e) =>
                handleAddressInputChange(
                  'postalCode',
                  e.target.value,
                  'postalCode',
                )
              }
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions((prev) => ({
                    ...prev,
                    postalCode: false,
                  }));
                }, 200);
              }}
              onFocus={() => {
                if (suggestions.postalCode.length > 0) {
                  setShowSuggestions((prev) => ({ ...prev, postalCode: true }));
                }
              }}
            />

            {showSuggestions.postalCode &&
              suggestions.postalCode.length > 0 && (
                <div className={styles.suggestionsList}>
                  {suggestions.postalCode.map((entry) => (
                    <div
                      key={entry.userGeneratedId ?? entry.uuid}
                      className={styles.suggestionItem}
                      onClick={() =>
                        handleSuggestionSelect('postalCode', entry)
                      }
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
});

PatientAddressInformation.displayName = 'PatientAddressInformation';

export default PatientAddressInformation;
