import { useState, useCallback } from 'react';
import { searchPatients } from '@services/patientSearchService';
import type { PatientSearchCriteria, PatientSearchResult } from '../types/patientSearch';

interface UsePatientSearchReturn {
  searchResults: PatientSearchResult[];
  isLoading: boolean;
  error: string | null;
  searchPatients: (criteria: PatientSearchCriteria) => Promise<void>;
  clearResults: () => void;
}

export const usePatientSearch = (): UsePatientSearchReturn => {
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (criteria: PatientSearchCriteria) => {
    // Don't search if all fields are empty
    if (!criteria.identifier?.trim() && !criteria.name?.trim() && !criteria.phoneNumber?.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchPatients(criteria);
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('No patients found');
      }
    } catch (err) {
      console.error('Patient search error:', err);
      
      // Provide more specific error messages based on the error
      if (err instanceof Error) {
        if (err.message.includes('400')) {
          setError('Invalid search criteria. Please check your input and try again.');
        } else if (err.message.includes('404')) {
          setError('Patient search service not available. Please contact support.');
        } else if (err.message.includes('500')) {
          setError('Server error occurred. Please try again later.');
        } else {
          setError(err.message || 'Error searching for patients. Please try again.');
        }
      } else {
        setError('Error searching for patients. Please try again.');
      }
      
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    searchPatients: handleSearch,
    clearResults,
  };
};
