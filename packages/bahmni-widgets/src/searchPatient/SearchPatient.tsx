import { Search, Button } from '@bahmni-frontend/bahmni-design-system';
import {
  searchPatientByNameOrId,
  PatientSearch,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import styles from './styles/SearchPatient.module.scss';

interface SearchPatientProps {
  buttonTitle: string;
  searchBarPlaceholder: string;
  handleSearchPatient: (
    data: PatientSearch[] | undefined,
    searchTerm: string,
    isLoading: boolean,
    isError: boolean,
  ) => void;
}

const SearchPatient: React.FC<SearchPatientProps> = ({
  buttonTitle,
  searchBarPlaceholder,
  handleSearchPatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['patientSearch', searchTerm],
    queryFn: () => searchPatientByNameOrId(encodeURI(searchTerm)),
    enabled: !!searchTerm,
    staleTime: 0,
  });

  const handleSearchTermUpdate = (searchInput: string) => {
    setSearchInput(searchInput);
  };

  const handlePatientSearch = () => {
    if (!searchInput) return;
    setSearchTerm(searchInput.trim());
  };

  const handleOnClear = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  useEffect(() => {
    if (isError && searchTerm)
      handleSearchPatient(data, searchTerm, isLoading, isError);
    if (searchTerm) handleSearchPatient(data, searchTerm, isLoading, isError);
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
          id="search-patient-seachbar"
          testId="search-patient-seachbar"
          size="lg"
          placeholder={searchBarPlaceholder}
          labelText="Search"
          value={searchInput}
          onChange={(e) => handleSearchTermUpdate(e.target.value)}
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              handlePatientSearch();
            }
          }}
          onClear={handleOnClear}
        />
        <Button
          id="search-patient-search-button"
          testId="search-patient-search-button"
          onClick={() => handlePatientSearch()}
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
