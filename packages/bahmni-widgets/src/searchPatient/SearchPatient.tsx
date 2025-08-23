import { Search, Button } from '@bahmni-frontend/bahmni-design-system';
import {
  searchPatientByNameOrId,
  PatientSearch,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import styles from './styles/SearchPatient.module.scss';

interface SearchPatientProps {
  handleSearchPatient: (
    data: PatientSearch[] | undefined,
    error: Error | null,
    loading: boolean,
  ) => void;
}

const SearchPatient: React.FC<SearchPatientProps> = ({
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

  useEffect(() => {
    if (searchTerm) handleSearchPatient(data, error, isLoading);
  }, [searchTerm, isLoading]);

  return (
    <div data-testid="search-patient" className={styles.searchPatient}>
      <Search
        testId="search-patient-seachbar"
        size="lg"
        placeholder="Search by name or patient ID"
        labelText="Search"
        id="search-patient-seachbar"
        onChange={(e) => handleSearchTermUpdate(e.target.value)}
      />
      <Button
        testId="search-patient-search-button"
        onClick={() => handlePatientSearch()}
      >
        Search
      </Button>
    </div>
  );
};
export default SearchPatient;
