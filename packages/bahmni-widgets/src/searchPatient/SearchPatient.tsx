import {
  Search,
  Button,
  Dropdown,
  Tag,
} from '@bahmni-frontend/bahmni-design-system';
import {
  searchPatientByNameOrId,
  searchPatientByCustomAttribute,
  PatientSearchResultBundle,
  useTranslation,
  getRegistrationConfig,
  PatientSearchField,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNotification } from '../notification';
import styles from './styles/SearchPatient.module.scss';

interface SearchPatientProps {
  buttonTitle: string;
  searchBarPlaceholder: string;
  onSearch: (
    data: PatientSearchResultBundle | undefined,
    searchTerm: string,
    isLoading: boolean,
    isError: boolean,
    isAdvancedSearch: boolean,
    searchedField?: PatientSearchField,
  ) => void;
}

const SearchPatient: React.FC<SearchPatientProps> = ({
  buttonTitle,
  searchBarPlaceholder,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [phoneSearchInput, setPhoneSearchInput] = useState('');
  const [phoneInputError, setPhoneInputError] = useState('');
  const { addNotification } = useNotification();
  const { t } = useTranslation();
  const [isAdvancedSearch, setIsAdvancedSearch] = useState<boolean>(false);
  const [dropdownItems, setDropdownItems] = useState<string[]>([]);
  const [selectedDropdownItem, setSelectedDropdownItem] = useState<string>('');
  const [searchFields, setSearchFields] = useState<PatientSearchField[]>([]);

  const {
    data: configData,
    isError: configIsError,
    error: configError,
  } = useQuery({
    queryKey: ['registrationConfig'],
    queryFn: () => getRegistrationConfig(),
    staleTime: 0,
    gcTime: 0,
  });

  const getPatientSearchQuery = () => {
    if (isAdvancedSearch) {
      const selectedField = searchFields.find(
        (field) => t(field.translationKey) === selectedDropdownItem,
      );

      const fieldType = selectedField?.type ?? '';
      const fieldsToSearch = selectedField ? selectedField.fields : [];

      return searchPatientByCustomAttribute(
        encodeURI(searchTerm),
        fieldType,
        fieldsToSearch,
        searchFields,
        t,
      );
    } else {
      return searchPatientByNameOrId(encodeURI(searchTerm));
    }
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'patientSearch',
      searchTerm,
      isAdvancedSearch,
      selectedDropdownItem,
    ],
    queryFn: getPatientSearchQuery,
    enabled: !!searchTerm,
    staleTime: 0,
    gcTime: 0,
  });

  const handleChange = (inputValue: string, type: 'name' | 'phone') => {
    if (type === 'phone') {
      if (selectedDropdownItem === dropdownItems[0]) {
        setPhoneSearchInput(inputValue);
        setSearchInput('');
        const hasPlusAtStart = inputValue.length > 0 && inputValue[0] === '+';
        const numericValue = inputValue.replace(/[^0-9]/g, '');
        const formattedValue = hasPlusAtStart
          ? '+' + numericValue
          : numericValue;
        setPhoneInputError(
          phoneInputError && inputValue !== formattedValue
            ? t('PHONE_NUMBER_VALIDATION_ERROR')
            : '',
        );
      } else {
        setPhoneInputError('');
        setPhoneSearchInput(inputValue);
        setSearchInput('');
      }
    } else {
      setPhoneInputError('');
      setPhoneSearchInput('');
      setSearchInput(inputValue);
    }
  };

  const handleClick = (type: 'name' | 'phone') => {
    const inputValue = type === 'phone' ? phoneSearchInput : searchInput;
    if (!inputValue.trim()) return;

    const trimmedValue = inputValue.trim();

    if (type === 'phone') {
      if (selectedDropdownItem === dropdownItems[0]) {
        const hasPlusAtStart = inputValue.length > 0 && inputValue[0] === '+';
        const numericValue = inputValue.replace(/[^0-9]/g, '');
        const formattedValue = hasPlusAtStart
          ? '+' + numericValue
          : numericValue;

        const hasInvalidChars =
          inputValue !== formattedValue && inputValue.length > 0;

        if (hasInvalidChars) {
          setPhoneInputError(t('PHONE_NUMBER_VALIDATION_ERROR'));
          return;
        } else {
          setPhoneInputError('');
          setSearchTerm(formattedValue);
          setPhoneSearchInput(trimmedValue);
        }
      } else {
        setPhoneInputError('');
        setPhoneSearchInput(trimmedValue);
        setSearchTerm(trimmedValue);
      }
    } else {
      setSearchInput(trimmedValue);
      setSearchTerm(trimmedValue);
    }

    setIsAdvancedSearch(type === 'phone');
  };

  const handleOnClear = (type: 'name' | 'phone') => {
    if (type === 'phone') {
      setPhoneSearchInput('');
      setPhoneInputError('');
    } else {
      setSearchInput('');
    }
    setSearchTerm('');
  };

  useEffect(() => {
    if (configIsError) {
      addNotification({
        title: t('CONFIG_ERROR_SCHEMA_VALIDATION_FAILED'),
        message:
          configError instanceof Error
            ? configError.message
            : String(configError),
        type: 'error',
      });
      setDropdownItems([]);
      setSelectedDropdownItem('');
    } else if (configData?.patientSearch?.customAttributes) {
      const customAttributes = configData.patientSearch.customAttributes;
      setSearchFields(customAttributes);
      const labels = customAttributes.map((field: PatientSearchField) =>
        t(field.translationKey),
      );
      setDropdownItems(labels);
      setSelectedDropdownItem(labels[0] || '');
    } else if (configData && dropdownItems.length === 0) {
      addNotification({
        title: t('CONFIG_ERROR_NOT_FOUND'),
        message: 'No patient search configuration found',
        type: 'error',
      });
      setDropdownItems([]);
      setSelectedDropdownItem('');
    }
  }, [configData, configIsError, configError, addNotification, t]);

  useEffect(() => {
    const selectedField = isAdvancedSearch
      ? searchFields.find(
          (field) => t(field.translationKey) === selectedDropdownItem,
        )
      : undefined;

    if (isError && searchTerm) {
      onSearch(
        data,
        searchTerm,
        isLoading,
        isError,
        isAdvancedSearch,
        selectedField,
      );
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error instanceof Error ? error.message : String(error),
        type: 'error',
      });
    }
    if (searchTerm)
      onSearch(
        data,
        searchTerm,
        isLoading,
        isError,
        isAdvancedSearch,
        selectedField,
      );
  }, [
    searchTerm,
    isLoading,
    isError,
    onSearch,
    data,
    isAdvancedSearch,
    selectedDropdownItem,
    searchFields,
    addNotification,
    t,
    error,
  ]);

  return (
    <div
      data-testid="search-patient-tile"
      id="search-patient-tile"
      className={styles.searchPatientContainer}
    >
      <div
        className={styles.searchPatient}
        data-testid="search-patient-input"
        id="search-patient-input"
      >
        <Search
          id="search-patient-searchbar"
          testId="search-patient-searchbar"
          placeholder={searchBarPlaceholder}
          labelText="Search"
          value={searchInput}
          onChange={(e) => handleChange(e.target.value, 'name')}
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              handleClick('name');
            }
          }}
          onClear={() => handleOnClear('name')}
        />
        <Button
          id="search-patient-search-button"
          testId="search-patient-search-button"
          size="md"
          onClick={() => handleClick('name')}
          disabled={isLoading || searchInput.trim().length === 0}
          className={styles.searchButton}
        >
          {buttonTitle}
        </Button>
      </div>

      <div className={styles.orDivider}>
        <Tag type="cool-gray">{t('OR')}</Tag>
      </div>

      <div className={styles.searchPatient}>
        <div className={styles.phoneSearchContainer}>
          <div className={styles.phoneInputWrapper}>
            <Search
              id="phone-search-input"
              testId="phone-search-input"
              labelText="Phone Search"
              placeholder={t('SEARCH_BY_CUSTOM_ATTRIBUTE', {
                attribute: String(selectedDropdownItem),
              })}
              value={phoneSearchInput}
              onChange={(e) => handleChange(e.target.value, 'phone')}
              onKeyDown={(e) => {
                if (e.code === 'Enter') {
                  handleClick('phone');
                }
              }}
              onClear={() => handleOnClear('phone')}
              inputMode="numeric"
            />
            {phoneInputError && (
              <div
                className={styles.errorMessage}
                data-testid="phone-validation-error"
              >
                {phoneInputError}
              </div>
            )}
          </div>
          <Dropdown
            id="search-type-dropdown"
            testId="search-type-dropdown"
            titleText=""
            label={selectedDropdownItem}
            className={styles.searchTypeDropdown}
            size="md"
            items={dropdownItems}
            selectedItem={selectedDropdownItem}
            onChange={(event) => {
              setSelectedDropdownItem(event.selectedItem ?? '');
              setPhoneSearchInput('');
              setSearchInput('');
              setSearchTerm('');
              setPhoneInputError('');
            }}
            aria-label={t('PATIENT_SEARCH_ATTRIBUTE_SELECTOR')}
          />
        </div>
        <Button
          size="md"
          id="phone-search-button"
          testId="phone-search-button"
          disabled={isLoading || phoneSearchInput.trim().length === 0}
          className={styles.searchButton}
          onClick={() => handleClick('phone')}
        >
          {buttonTitle}
        </Button>
      </div>
    </div>
  );
};
export default SearchPatient;
