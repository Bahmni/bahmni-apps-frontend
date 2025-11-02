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
  houseNumber: '',
  locality: '',
  district: '',
  city: '',
  state: '',
  pincode: '',
};

const initialErrors: AddressErrors = {
  houseNumber: '',
  locality: '',
  district: '',
  city: '',
  state: '',
  pincode: '',
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
    district: [] as AddressHierarchyEntry[],
    state: [] as AddressHierarchyEntry[],
    pincode: [] as AddressHierarchyEntry[],
  });

  const [showSuggestions, setShowSuggestions] = useState({
    district: false,
    state: false,
    pincode: false,
  });

  // Track if field value was selected from dropdown
  const [selectedFromDropdown, setSelectedFromDropdown] = useState({
    district: false,
    state: false,
    pincode: false,
  });

  // debounce timers per field
  const debounceTimers = useRef<Record<string, number | null>>({
    district: null,
    state: null,
    pincode: null,
  });

  const validate = useCallback(() => {
    const nextErrors: AddressErrors = { ...initialErrors };

    // Address fields are optional, but if they have a value, it must be from dropdown
    if (formData.district && !selectedFromDropdown.district) {
      nextErrors.district =
        t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN') ??
        'Select input from dropdown';
    }

    if (formData.state && !selectedFromDropdown.state) {
      nextErrors.state =
        t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN') ??
        'Select input from dropdown';
    }

    if (formData.pincode && !selectedFromDropdown.pincode) {
      nextErrors.pincode =
        t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN') ??
        'Select input from dropdown';
    }

    setAddressErrors(nextErrors);
    return Object.values(nextErrors).every((v) => !v);
  }, [formData, t, selectedFromDropdown]);

  const getData = useCallback((): PatientAddress => {
    // Map form field names to API field names
    return {
      ...(formData.houseNumber && { address1: formData.houseNumber }),
      ...(formData.locality && { address2: formData.locality }),
      ...(formData.city && { cityVillage: formData.city }),
      ...(formData.district && { countyDistrict: formData.district }),
      ...(formData.state && { stateProvince: formData.state }),
      ...(formData.pincode && { postalCode: formData.pincode }),
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
      if (field === 'district' || field === 'state' || field === 'pincode') {
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

      if (field === 'pincode') {
        if (parents[0]) {
          onInputChange('district', parents[0].name);
          nextErrors.district = '';
          nextSelectedFromDropdown.district = true;
        }
        if (parents[1]) {
          onInputChange('state', parents[1].name);
          nextErrors.state = '';
          nextSelectedFromDropdown.state = true;
        }
      } else if (field === 'district') {
        if (parents[0]) {
          onInputChange('state', parents[0].name);
          nextErrors.state = '';
          nextSelectedFromDropdown.state = true;
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
                  setShowSuggestions((prev) => ({ ...prev, district: false }));
                }, 200);
              }}
              onFocus={() => {
                if (suggestions.district.length > 0) {
                  setShowSuggestions((prev) => ({ ...prev, district: true }));
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
                  setShowSuggestions((prev) => ({ ...prev, state: false }));
                }, 200);
              }}
              onFocus={() => {
                if (suggestions.state.length > 0) {
                  setShowSuggestions((prev) => ({ ...prev, state: true }));
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
                  setShowSuggestions((prev) => ({ ...prev, pincode: false }));
                }, 200);
              }}
              onFocus={() => {
                if (suggestions.pincode.length > 0) {
                  setShowSuggestions((prev) => ({ ...prev, pincode: true }));
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
});

PatientAddressInformation.displayName = 'PatientAddressInformation';

export default PatientAddressInformation;
