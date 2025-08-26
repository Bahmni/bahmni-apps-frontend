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
  emptyStateMessage: string;
  errorMessage: string;
  handleSearchPatient: (
    data: PatientSearch[] | undefined,
    searchTerm: string,
  ) => void;
}

const SearchPatient: React.FC<SearchPatientProps> = ({
  buttonTitle,
  searchBarPlaceholder,
  emptyStateMessage,
  errorMessage,
  handleSearchPatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data, error, isLoading } = useQuery({
    queryKey: ['patientSearch', searchTerm],
    queryFn: () => searchPatientByNameOrId(searchTerm),
    enabled: !!searchTerm,
  });

  const handleSearchTermUpdate = (searchInput: string) => {
    setSearchInput(searchInput);
  };

  const handlePatientSearch = () => {
    if (!searchInput) return;
    setSearchTerm(searchInput);
  };

  const handleOnClear = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  useEffect(() => {
    if (searchTerm) handleSearchPatient(data, searchTerm);
  }, [searchTerm, isLoading]);

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
          onChange={(e) => handleSearchTermUpdate(e.target.value)}
          onClear={handleOnClear}
        />
        <Button
          id="search-patient-search-button"
          testId="search-patient-search-button"
          onClick={() => handlePatientSearch()}
          disabled={isLoading}
        >
          {buttonTitle}
        </Button>
      </div>
      {error && searchTerm !== '' && (
        <div
          className={styles.errorMessage}
          data-testid="search-patient-error-message"
          id="search-patient-error-message"
        >
          {errorMessage}
        </div>
      )}
      {data && data.length == 0 && searchTerm !== '' && (
        <div
          className={styles.errorMessage}
          data-testid="search-patient-empty-message"
          id="search-patient-empty-message"
        >
          {emptyStateMessage}
        </div>
      )}
    </div>
  );
};
export default SearchPatient;
