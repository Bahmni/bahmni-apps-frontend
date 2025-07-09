import React, { useState } from 'react';
import '@carbon/styles/css/styles.css';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { SearchResultsTable } from './SearchResultsTable';
import { useSearchStore } from '@/stores/registration/useSearchStore';
import { SearchService } from '@/services/registration/SearchService';
import { FhirPatient as Patient } from '@/types/patient';

export const SearchPatientPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { searchResults, setSearchResults } = useSearchStore();

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const results = await SearchService.search({ q: query });
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search for patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="search-patient-page">
      <h2>Patient Search</h2>
      <div className="search-form">
        <Input
          label="Search by Name or ID"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : 'Search'}
        </Button>
      </div>
      <div className="search-results">
        <SearchResultsTable results={searchResults} onSelect={() => {}} />
      </div>
    </div>
  );
};
