import { searchPatientByNameOrId, PatientSearchResult } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export interface PatientSuggestion {
  id: string;
  text: string;
  identifier: string;
  name: string;
}

const MIN_SEARCH_LENGTH = 2;

const formatPatientName = (patient: PatientSearchResult): string => {
  return `${patient.givenName} ${patient.middleName || ''} ${patient.familyName}`
    .replace(/\s+/g, ' ')
    .trim();
};

export const usePatientSearch = () => {
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);

  const { data: searchResults } = useQuery({
    queryKey: ['patientSearch', searchTerms[activeSearchId ?? '']],
    queryFn: () => searchPatientByNameOrId(searchTerms[activeSearchId ?? '']),
    enabled:
      !!activeSearchId &&
      (searchTerms[activeSearchId]?.length ?? 0) >= MIN_SEARCH_LENGTH,
    staleTime: 0,
    gcTime: 0,
  });

  const getPatientSuggestions = (rowId: string): PatientSuggestion[] => {
    if (!searchTerms[rowId] || searchTerms[rowId].length < MIN_SEARCH_LENGTH)
      return [];

    return (searchResults?.pageOfResults ?? []).map(
      (patient: PatientSearchResult) => {
        const fullName = formatPatientName(patient);
        return {
          id: patient.uuid,
          text: `${fullName} (${patient.identifier})`,
          identifier: patient.identifier ?? '',
          name: fullName,
        };
      },
    );
  };

  const handleSearch = (rowId: string, searchValue: string) => {
    setSearchTerms((prev) => ({ ...prev, [rowId]: searchValue }));
    setActiveSearchId(rowId);
  };

  const clearSearch = (rowId: string) => {
    setSearchTerms((prev) => {
      const updated = { ...prev };
      delete updated[rowId];
      return updated;
    });
  };

  const clearAllSearches = () => {
    setSearchTerms({});
    setActiveSearchId(null);
  };

  return {
    searchTerms,
    getPatientSuggestions,
    handleSearch,
    clearSearch,
    clearAllSearches,
    setSearchTerms,
  };
};
