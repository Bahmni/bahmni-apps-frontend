import { searchPatientByNameOrId, PatientSearchResult } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export interface PatientSuggestion {
  id: string;
  text: string;
  identifier: string;
  name: string;
}

export const usePatientSearch = () => {
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);

  const { data: searchResults } = useQuery({
    queryKey: ['patientSearch', searchTerms[activeSearchId ?? '']],
    queryFn: () =>
      searchPatientByNameOrId(encodeURI(searchTerms[activeSearchId ?? ''])),
    enabled:
      !!activeSearchId && (searchTerms[activeSearchId]?.length ?? 0) >= 2,
    staleTime: 0,
    gcTime: 0,
  });

  const getPatientSuggestions = (rowId: string): PatientSuggestion[] => {
    if (!searchTerms[rowId] || searchTerms[rowId].length < 2) return [];

    return (searchResults?.pageOfResults ?? []).map(
      (patient: PatientSearchResult) => ({
        id: patient.uuid,
        text:
          `${patient.givenName} ${patient.middleName || ''} ${patient.familyName}`
            .replace(/\s+/g, ' ')
            .trim() + ` (${patient.identifier})`,
        identifier: patient.identifier ?? '',
        name: `${patient.givenName} ${patient.middleName || ''} ${patient.familyName}`
          .replace(/\s+/g, ' ')
          .trim(),
      }),
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
