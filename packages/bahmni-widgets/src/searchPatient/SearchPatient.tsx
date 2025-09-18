import {
  Search,
  Button,
  Dropdown,
  Tag,
} from '@bahmni-frontend/bahmni-design-system';
import {
  searchPatientByNameOrId,
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
  ) => void;
}

const SearchPatient: React.FC<SearchPatientProps> = ({
  buttonTitle,
  searchBarPlaceholder,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { addNotification } = useNotification();
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['patientSearch', searchTerm],
    queryFn: () => searchPatientByNameOrId(encodeURI(searchTerm)),
    enabled: !!searchTerm,
    staleTime: 0,
    gcTime: 0,
  });

  const handleChange = (searchInput: string) => {
    setSearchInput(searchInput);
  };

  const handleClick = () => {
    if (!searchInput.trim()) return;
    setSearchInput(searchInput.trim());
    setSearchTerm(searchInput.trim());
  };

  const handleOnClear = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  useEffect(() => {
    if (isError && searchTerm) {
      onSearch(data, searchTerm, isLoading, isError);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
        timeout: 5000,
      });
    }
    if (searchTerm) onSearch(data, searchTerm, isLoading, isError);
  }, [searchTerm, isLoading, isError]);

  return (
    <div
      data-testid="search-patient-tile"
      id="search-patient-tile"
      className={styles.searchPatientTile}
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
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              handleClick();
            }
          }}
          onClear={handleOnClear}
        />
        <Button
          id="search-patient-search-button"
          testId="search-patient-search-button"
          size="md"
          onClick={handleClick}
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
          <Search
            id="phone-search-input"
            testId="phone-search-input"
            labelText=""
            placeholder={t('SEARCH_BY_PHONE_NUMBER')}
            aria-label={t('SEARCH_BY_PHONE_NUMBER')}
          />
          <Dropdown
            id="search-type-dropdown"
            testId="search-type-dropdown"
            titleText=""
            label="Phone number"
            onChange={({ selectedItem }) => {
              if (selectedItem) {
              }
            }}
            className={styles.searchTypeDropdown}
            size="md"
            items={[]}
          />
        </div>
        <Button
          size="md"
          testId="phone-search-button"
          disabled={isLoading || searchInput.trim().length === 0}
          className={styles.searchButton}
        >
          {buttonTitle}
        </Button>
      </div>
    </div>
  );
};
export default SearchPatient;
