import { create } from 'zustand';
import { FhirPatient as Patient } from '@/types/patient';

interface SearchState {
  searchResults: Patient[];
  setSearchResults: (results: Patient[]) => void;
  clearSearchResults: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),
  clearSearchResults: () => set({ searchResults: [] }),
}));
