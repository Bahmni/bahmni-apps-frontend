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
    isPhoneSearch: boolean,
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
  const [isPhoneSearch, setIsPhoneSearch] = useState<boolean>(false);
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

  const handleChange = (inputValue: string, type: 'name' | 'phone') => {
    if (type === 'phone') {
      setPhoneSearchInput(inputValue);
      setSearchInput('');
      const numericValue = inputValue.replace(/[^0-9]/g, '');
      setPhoneInputError(
        phoneInputError && inputValue !== numericValue
          ? t('PHONE_NUMBER_VALIDATION_ERROR')
          : '',
      );
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
      const numericValue = inputValue.replace(/[^0-9]/g, '');
      const hasInvalidChars =
        inputValue !== numericValue && inputValue.length > 0;

      setPhoneInputError(
        hasInvalidChars ? t('PHONE_NUMBER_VALIDATION_ERROR') : '',
      );
      setSearchTerm(hasInvalidChars ? '' : trimmedValue);
      setPhoneSearchInput(trimmedValue);
    } else {
      setSearchInput(trimmedValue);
      setSearchTerm(trimmedValue);
    }

    setIsPhoneSearch(type === 'phone');
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
    if (isError && searchTerm) {
      onSearch(data, searchTerm, isLoading, isError, isPhoneSearch);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error instanceof Error ? error.message : String(error),
        type: 'error',
      });
    }
    if (searchTerm)
      onSearch(data, searchTerm, isLoading, isError, isPhoneSearch);
  }, [searchTerm, isLoading, isError]);

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
              placeholder={t('SEARCH_BY_PHONE_NUMBER')}
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
