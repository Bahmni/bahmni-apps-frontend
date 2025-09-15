import { Search, Button } from '@bahmni-frontend/bahmni-design-system';
import {
  searchPatientByNameOrId,
  PatientSearchResultBundle,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
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
    queryClient.invalidateQueries({ queryKey: ['patientSearch'] });
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
          size="lg"
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
          onClick={handleClick}
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
