import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  getAddressHierarchyEntries,
  type AddressHierarchyEntry,
  type PatientAddress,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRegistrationConfig } from '../../../hooks/useRegistrationConfig';
import { AddressData } from '../../../models/patient';
import type { AddressErrors } from '../../../models/validation';
import styles from './styles/index.module.scss';

export type AddressInfoRef = {
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

interface AddressInfoProps {
  ref?: React.Ref<AddressInfoRef>;
}

export const AddressInfo = ({ ref }: AddressInfoProps) => {
  const { t } = useTranslation();

  // Get registration config for address field ordering
  const { registrationConfig } = useRegistrationConfig();
  const addressConfig =
    registrationConfig?.patientInformation?.addressHierarchy;
  const showTopDown = addressConfig?.showAddressFieldsTopDown ?? false;

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

  // Track search queries for each field
  const [searchQueries, setSearchQueries] = useState({
    countyDistrict: '',
    stateProvince: '',
    postalCode: '',
  });

  // debounce timers per field
  const debounceTimers = useRef<Record<string, number | null>>({
    countyDistrict: null,
    stateProvince: null,
    postalCode: null,
  });

  // Use TanStack Query for address hierarchy entries
  const { data: districtSuggestions } = useQuery({
    queryKey: [
      'addressHierarchy',
      'countyDistrict',
      searchQueries.countyDistrict,
    ],
    queryFn: () =>
      getAddressHierarchyEntries(
        'countyDistrict',
        searchQueries.countyDistrict,
      ),
    enabled: searchQueries.countyDistrict.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: stateSuggestions } = useQuery({
    queryKey: [
      'addressHierarchy',
      'stateProvince',
      searchQueries.stateProvince,
    ],
    queryFn: () =>
      getAddressHierarchyEntries('stateProvince', searchQueries.stateProvince),
    enabled: searchQueries.stateProvince.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const { data: postalCodeSuggestions } = useQuery({
    queryKey: ['addressHierarchy', 'postalCode', searchQueries.postalCode],
    queryFn: () =>
      getAddressHierarchyEntries('postalCode', searchQueries.postalCode),
    enabled: searchQueries.postalCode.length >= 2,
    staleTime: 5 * 60 * 1000,
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
    (field: string, searchText: string) => {
      // clear existing timer
      const existing = debounceTimers.current[field];
      if (existing) {
        window.clearTimeout(existing);
      }

      const id = window.setTimeout(() => {
        if (!searchText || searchText.length < 2) {
          setSearchQueries((prev) => ({ ...prev, [field]: '' }));
          setSuggestions((prev) => ({ ...prev, [field]: [] }));
          setShowSuggestions((prev) => ({ ...prev, [field]: false }));
          return;
        }

        // Update search query to trigger TanStack Query
        setSearchQueries((prev) => ({ ...prev, [field]: searchText }));
      }, 300);

      debounceTimers.current[field] = id;
    },
    [],
  );

  // Sync TanStack Query results with suggestions state
  useEffect(() => {
    if (districtSuggestions) {
      setSuggestions((prev) => ({
        ...prev,
        countyDistrict: districtSuggestions,
      }));
      setShowSuggestions((prev) => ({
        ...prev,
        countyDistrict: districtSuggestions.length > 0,
      }));
    }
  }, [districtSuggestions]);

  useEffect(() => {
    if (stateSuggestions) {
      setSuggestions((prev) => ({ ...prev, stateProvince: stateSuggestions }));
      setShowSuggestions((prev) => ({
        ...prev,
        stateProvince: stateSuggestions.length > 0,
      }));
    }
  }, [stateSuggestions]);

  useEffect(() => {
    if (postalCodeSuggestions) {
      setSuggestions((prev) => ({
        ...prev,
        postalCode: postalCodeSuggestions,
      }));
      setShowSuggestions((prev) => ({
        ...prev,
        postalCode: postalCodeSuggestions.length > 0,
      }));
    }
  }, [postalCodeSuggestions]);

  const handleAddressInputChange = useCallback(
    (field: keyof AddressData, value: string) => {
      onInputChange(field, value);
      if (
        field === 'countyDistrict' ||
        field === 'stateProvince' ||
        field === 'postalCode'
      ) {
        // Mark as not selected from dropdown when user types
        setSelectedFromDropdown((prev) => ({ ...prev, [field]: false }));
        debouncedSearchAddress(field, value);
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

  // Define field order based on configuration
  const addressFieldsOrder = useMemo(() => {
    if (showTopDown) {
      // Top-down: State -> District -> City/Village -> Locality -> House Number -> Pincode
      return [
        'stateProvince',
        'countyDistrict',
        'cityVillage',
        'address2',
        'address1',
        'postalCode',
      ];
    } else {
      // Bottom-up (default): House Number -> Locality -> District -> City -> State -> Pincode
      return [
        'address1',
        'address2',
        'countyDistrict',
        'cityVillage',
        'stateProvince',
        'postalCode',
      ];
    }
  }, [showTopDown]);

  // Render address field based on field type
  const renderAddressField = useCallback(
    (fieldKey: string) => {
      switch (fieldKey) {
        case 'address1':
          return (
            <div key="address1" className={styles.col}>
              <TextInput
                id="house-number"
                labelText={t('CREATE_PATIENT_HOUSE_NUMBER')}
                placeholder={t('CREATE_PATIENT_ADDRESS_LINE_PLACEHOLDER')}
                value={formData.address1}
                onChange={(e) => onInputChange('address1', e.target.value)}
              />
            </div>
          );

        case 'address2':
          return (
            <div key="address2" className={styles.col}>
              <TextInput
                id="locality"
                labelText={t('CREATE_PATIENT_LOCALITY')}
                placeholder={t('CREATE_PATIENT_LOCALITY')}
                value={formData.address2}
                onChange={(e) => onInputChange('address2', e.target.value)}
              />
            </div>
          );

        case 'countyDistrict':
          return (
            <div key="countyDistrict" className={styles.col}>
              <div className={styles.addressFieldWrapper}>
                <TextInput
                  id="district"
                  labelText={t('CREATE_PATIENT_DISTRICT')}
                  placeholder={t('CREATE_PATIENT_DISTRICT')}
                  value={formData.countyDistrict}
                  invalid={!!addressErrors.countyDistrict}
                  invalidText={addressErrors.countyDistrict}
                  onChange={(e) =>
                    handleAddressInputChange('countyDistrict', e.target.value)
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
                          <div className={styles.suggestionName}>
                            {entry.name}
                          </div>
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

        case 'cityVillage':
          return (
            <div key="cityVillage" className={styles.col}>
              <TextInput
                id="city"
                labelText={t('CREATE_PATIENT_CITY')}
                placeholder={t('CREATE_PATIENT_CITY')}
                value={formData.cityVillage}
                onChange={(e) => onInputChange('cityVillage', e.target.value)}
              />
            </div>
          );

        case 'stateProvince':
          return (
            <div key="stateProvince" className={styles.col}>
              <div className={styles.addressFieldWrapper}>
                <TextInput
                  id="state"
                  labelText={t('CREATE_PATIENT_STATE')}
                  placeholder={t('CREATE_PATIENT_STATE')}
                  value={formData.stateProvince}
                  invalid={!!addressErrors.stateProvince}
                  invalidText={addressErrors.stateProvince}
                  onChange={(e) =>
                    handleAddressInputChange('stateProvince', e.target.value)
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
                          <div className={styles.suggestionName}>
                            {entry.name}
                          </div>
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

        case 'postalCode':
          return (
            <div key="postalCode" className={styles.col}>
              <div className={styles.addressFieldWrapper}>
                <TextInput
                  id="pincode"
                  labelText={t('CREATE_PATIENT_PINCODE')}
                  placeholder={t('CREATE_PATIENT_PINCODE')}
                  value={formData.postalCode}
                  invalid={!!addressErrors.postalCode}
                  invalidText={addressErrors.postalCode}
                  onChange={(e) =>
                    handleAddressInputChange('postalCode', e.target.value)
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
                      setShowSuggestions((prev) => ({
                        ...prev,
                        postalCode: true,
                      }));
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
                          <div className={styles.suggestionName}>
                            {entry.name}
                          </div>
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

        default:
          return null;
      }
    },
    [
      formData,
      addressErrors,
      suggestions,
      showSuggestions,
      t,
      onInputChange,
      handleAddressInputChange,
      handleSuggestionSelect,
    ],
  );

  return (
    <div className={styles.formSection}>
      <span className={styles.sectionTitle}>
        {t('CREATE_PATIENT_SECTION_ADDRESS_INFO')}
      </span>

      <div className={styles.row}>
        {addressFieldsOrder.map((field) => renderAddressField(field))}
      </div>
    </div>
  );
};

AddressInfo.displayName = 'AddressInfo';

export default AddressInfo;
