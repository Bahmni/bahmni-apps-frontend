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
  PatientSearchField,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNotification } from '../notification';
import styles from './styles/SearchPatient.module.scss';

interface SearchInputProps {
  id: string;
  testId: string;
  placeholder: string;
  labelText: string;
  inputMode?: 'text' | 'email' | 'numeric';
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  error?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  id,
  testId,
  placeholder,
  labelText,
  inputMode = 'text',
  value,
  onChange,
  onSubmit,
  onClear,
  error,
}) => (
  <div className={styles.phoneInputWrapper}>
    <Search
      id={id}
      testId={testId}
      placeholder={placeholder}
      labelText={labelText}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.code === 'Enter') {
          onSubmit();
        }
      }}
      onClear={onClear}
      inputMode={inputMode}
    />
    {error && (
      <div
        className={styles.errorMessage}
        data-testid={
          testId === 'phone-search-input'
            ? 'phone-validation-error'
            : `${testId}-error`
        }
      >
        {error}
      </div>
    )}
  </div>
);

interface SearchPatientProps {
  buttonTitle: string;
  searchBarPlaceholder: string;
  searchFields?: PatientSearchField[];
  onSearch: (
    data: PatientSearchResultBundle | undefined,
    searchTerm: string,
    isLoading: boolean,
    isError: boolean,
    isPhoneSearch: boolean,
  ) => void;
}

const SearchPatient: React.FC<SearchPatientProps> = ({
  buttonTitle,
  searchBarPlaceholder,
  searchFields,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedSearchField, setSelectedSearchField] =
    useState<PatientSearchField | null>(null);
  const [inputError, setInputError] = useState('');
  const [isUsingPhoneSearch, setIsUsingPhoneSearch] = useState(false);
  const { addNotification } = useNotification();
  const { t } = useTranslation();

  useEffect(() => {
    if (searchFields && searchFields.length > 0) {
      const defaultField =
        searchFields.find((field) => field.default) ?? searchFields[0];
      setSelectedSearchField(defaultField);
    }
  }, [searchFields]);

  const isConfigurableSearch = searchFields && searchFields.length > 0;
  const isPhoneSearch = isConfigurableSearch 
    ? Boolean(
        (selectedSearchField?.fields.includes('phoneNumber') ?? false) ||
          (selectedSearchField?.fields.includes('alternatePhoneNumber') ?? false),
      )
    : isUsingPhoneSearch;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['patientSearch', searchTerm, isPhoneSearch],
    queryFn: () => {
      if (isPhoneSearch) {
        return searchPatientByCustomAttribute(encodeURI(searchTerm), t);
      } else {
        return searchPatientByNameOrId(encodeURI(searchTerm));
      }
    },
    enabled: !!searchTerm,
    staleTime: 0,
    gcTime: 0,
  });

  const handleChange = (inputValue: string, isPhoneInput = false) => {
    setSearchInput(inputValue);

    if (isPhoneInput || isPhoneSearch) {
      const numericValue = inputValue.replace(/[^0-9]/g, '');
      setInputError(
        inputError && inputValue !== numericValue
          ? t('PHONE_NUMBER_VALIDATION_ERROR')
          : '',
      );
    } else {
      setInputError('');
    }
  };

  const handleRegularClick = () => {
    if (!searchInput.trim()) return;

    const trimmedValue = searchInput.trim();
    setSearchTerm(trimmedValue);
    setSearchInput(trimmedValue);
    setIsUsingPhoneSearch(false);
  };

  const handlePhoneClick = () => {
    if (!searchInput.trim()) return;

    const trimmedValue = searchInput.trim();
    const numericValue = searchInput.replace(/[^0-9]/g, '');
    const hasInvalidChars =
      searchInput !== numericValue && searchInput.length > 0;

    setInputError(hasInvalidChars ? t('PHONE_NUMBER_VALIDATION_ERROR') : '');
    setSearchTerm(hasInvalidChars ? '' : trimmedValue);
    setSearchInput(trimmedValue);
    setIsUsingPhoneSearch(true);
  };

  const handleOnClear = () => {
    setSearchInput('');
    setInputError('');
    setSearchTerm('');
    setIsUsingPhoneSearch(false);
  };

  const handleDropdownChange = (selectedItem: string) => {
    const field = searchFields?.find((f) => f.label === selectedItem);
    if (field) {
      setSelectedSearchField(field);
      setSearchInput('');
      setInputError('');
      setSearchTerm('');
    }
  };

  useEffect(() => {
    if (isError && searchTerm) {
      onSearch(data, searchTerm, isLoading, isError, isPhoneSearch);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
        timeout: 5000,
      });
    }
    if (searchTerm)
      onSearch(data, searchTerm, isLoading, isError, isPhoneSearch);
  }, [searchTerm, isLoading, isError]);

  if (isConfigurableSearch && selectedSearchField) {
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
          <SearchInput
            id="search-patient-searchbar"
            testId="search-patient-searchbar"
            placeholder={
              selectedSearchField.placeholder ??
              `Search by ${selectedSearchField.label.toLowerCase()}`
            }
            labelText="Search"
            inputMode={
              selectedSearchField.fields.includes('email') ? 'email' : 'text'
            }
            value={searchInput}
            onChange={handleChange}
            onSubmit={handleRegularClick}
            onClear={handleOnClear}
          />
          <Button
            id="search-patient-search-button"
            testId="search-patient-search-button"
            size="md"
            onClick={handleRegularClick}
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
            <SearchInput
              id="configurable-search-input"
              testId="configurable-search-input"
              labelText="Configurable Search"
              placeholder={
                selectedSearchField.placeholder ??
                `Search by ${selectedSearchField.label.toLowerCase()}`
              }
              inputMode={
                selectedSearchField.fields.includes('email') ? 'email' : 'text'
              }
              value={searchInput}
              onChange={(value) => handleChange(value, true)}
              onSubmit={handlePhoneClick}
              onClear={handleOnClear}
              error={inputError}
            />
            <Dropdown
              id="search-type-dropdown"
              testId="search-type-dropdown"
              titleText=""
              label={selectedSearchField.label}
              className={styles.searchTypeDropdown}
              size="md"
              items={searchFields.map((field) => field.label)}
              selectedItem={selectedSearchField.label}
              onChange={({ selectedItem }) =>
                handleDropdownChange(selectedItem ?? '')
              }
            />
          </div>
          <Button
            size="md"
            id="configurable-search-button"
            testId="configurable-search-button"
            disabled={isLoading || searchInput.trim().length === 0}
            className={styles.searchButton}
            onClick={handlePhoneClick}
          >
            {buttonTitle}
          </Button>
        </div>
      </div>
    );
  }

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
        <SearchInput
          id="search-patient-searchbar"
          testId="search-patient-searchbar"
          placeholder={searchBarPlaceholder}
          labelText="Search"
          value={searchInput}
          onChange={handleChange}
          onSubmit={handleRegularClick}
          onClear={handleOnClear}
        />
        <Button
          id="search-patient-search-button"
          testId="search-patient-search-button"
          size="md"
          onClick={handleRegularClick}
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
          <SearchInput
            id="phone-search-input"
            testId="phone-search-input"
            labelText="Phone Search"
            placeholder={t('SEARCH_BY_PHONE_NUMBER')}
            inputMode="numeric"
            value={searchInput}
            onChange={(value) => handleChange(value, true)}
            onSubmit={handlePhoneClick}
            onClear={handleOnClear}
            error={inputError}
          />
          <Dropdown
            id="search-type-dropdown"
            testId="search-type-dropdown"
            titleText=""
            label={t('PHONE_NUMBER')}
            className={styles.searchTypeDropdown}
            size="md"
            items={[t('PHONE_NUMBER')]}
            selectedItem={t('PHONE_NUMBER')}
          />
        </div>
        <Button
          size="md"
          id="phone-search-button"
          testId="phone-search-button"
          disabled={isLoading || searchInput.trim().length === 0}
          className={styles.searchButton}
          onClick={handlePhoneClick}
        >
          {buttonTitle}
        </Button>
      </div>
    </div>
  );
};

export default SearchPatient;
