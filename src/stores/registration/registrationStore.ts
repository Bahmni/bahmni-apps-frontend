/**
 * Registration Store
 * Global state management for registration module using Zustand
 */

import { create } from 'zustand';
import {
  OpenMRSPatient,
  PatientSearchResult,
  PatientIdentifierType,
  PersonAttributeType,
  AddressLevel,
} from '../../types/registration';
import {
  RelationshipType,
} from '../../types/registration/relationships';
import {
  REGISTRATION_LOADING_STATES,
  REGISTRATION_ERROR_CODES,
} from '../../constants/registration';

export interface RegistrationState {
  // Configuration Data
  identifierTypes: PatientIdentifierType[];
  personAttributeTypes: PersonAttributeType[];
  relationshipTypes: RelationshipType[];
  addressHierarchy: AddressLevel[];
  locations: Array<{ uuid: string; display: string }>;

  // Current State
  currentPatient: OpenMRSPatient | null;
  searchResults: PatientSearchResult[];
  searchQuery: string;

  // Loading States
  isLoading: boolean;
  isSearching: boolean;
  isSaving: boolean;
  isLoadingConfig: boolean;

  // Error Handling
  error: string | null;
  searchError: string | null;

  // Pagination
  totalSearchResults: number;
  currentPage: number;
  pageSize: number;
  hasMoreResults: boolean;

  // Actions - Configuration
  setIdentifierTypes: (types: PatientIdentifierType[]) => void;
  setPersonAttributeTypes: (types: PersonAttributeType[]) => void;
  setRelationshipTypes: (types: RelationshipType[]) => void;
  setAddressHierarchy: (hierarchy: AddressLevel[]) => void;
  setLocations: (locations: Array<{ uuid: string; display: string }>) => void;

  // Actions - Patient Management
  setCurrentPatient: (patient: OpenMRSPatient | null) => void;
  updateCurrentPatient: (updates: Partial<OpenMRSPatient>) => void;

  // Actions - Search
  setSearchResults: (results: PatientSearchResult[]) => void;
  clearSearchResults: () => void;
  setSearchQuery: (query: string) => void;
  addSearchResults: (results: PatientSearchResult[]) => void;

  // Actions - Loading States
  setLoading: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
  setSaving: (saving: boolean) => void;
  setLoadingConfig: (loading: boolean) => void;

  // Actions - Error Handling
  setError: (error: string | null) => void;
  setSearchError: (error: string | null) => void;
  clearErrors: () => void;

  // Actions - Pagination
  setSearchPagination: (pagination: {
    totalResults: number;
    currentPage: number;
    pageSize: number;
    hasMore: boolean;
  }) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;

  // Actions - Utility
  reset: () => void;
  resetSearch: () => void;

  // Getters
  getState: () => RegistrationState;
  getIdentifierTypeByUuid: (uuid: string) => PatientIdentifierType | undefined;
  getPersonAttributeTypeByUuid: (uuid: string) => PersonAttributeType | undefined;
  getRelationshipTypeByUuid: (uuid: string) => RelationshipType | undefined;
  getLocationByUuid: (uuid: string) => { uuid: string; display: string } | undefined;
}

const initialState = {
  // Configuration Data
  identifierTypes: [],
  personAttributeTypes: [],
  relationshipTypes: [],
  addressHierarchy: [],
  locations: [],

  // Current State
  currentPatient: null,
  searchResults: [],
  searchQuery: '',

  // Loading States
  isLoading: false,
  isSearching: false,
  isSaving: false,
  isLoadingConfig: false,

  // Error Handling
  error: null,
  searchError: null,

  // Pagination
  totalSearchResults: 0,
  currentPage: 0,
  pageSize: 10,
  hasMoreResults: false,
};

export const useRegistrationStore = create<RegistrationState>((set, get) => ({
  ...initialState,

  // Configuration Actions
  setIdentifierTypes: (types: PatientIdentifierType[]) => {
    set({ identifierTypes: types });
  },

  setPersonAttributeTypes: (types: PersonAttributeType[]) => {
    set({ personAttributeTypes: types });
  },

  setRelationshipTypes: (types: RelationshipType[]) => {
    set({ relationshipTypes: types });
  },

  setAddressHierarchy: (hierarchy: AddressLevel[]) => {
    set({ addressHierarchy: hierarchy });
  },

  setLocations: (locations: Array<{ uuid: string; display: string }>) => {
    set({ locations });
  },

  // Patient Management Actions
  setCurrentPatient: (patient: OpenMRSPatient | null) => {
    set({ currentPatient: patient });
  },

  updateCurrentPatient: (updates: Partial<OpenMRSPatient>) => {
    set((state) => ({
      currentPatient: state.currentPatient
        ? { ...state.currentPatient, ...updates }
        : null,
    }));
  },

  // Search Actions
  setSearchResults: (results: PatientSearchResult[]) => {
    set({
      searchResults: results,
      currentPage: 0,
    });
  },

  clearSearchResults: () => {
    set({
      searchResults: [],
      totalSearchResults: 0,
      currentPage: 0,
      hasMoreResults: false,
      searchError: null,
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  addSearchResults: (results: PatientSearchResult[]) => {
    set((state) => ({
      searchResults: [...state.searchResults, ...results],
    }));
  },

  // Loading State Actions
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setSearching: (searching: boolean) => {
    set({ isSearching: searching });
  },

  setSaving: (saving: boolean) => {
    set({ isSaving: saving });
  },

  setLoadingConfig: (loading: boolean) => {
    set({ isLoadingConfig: loading });
  },

  // Error Handling Actions
  setError: (error: string | null) => {
    set({ error });
  },

  setSearchError: (error: string | null) => {
    set({ searchError: error });
  },

  clearErrors: () => {
    set({
      error: null,
      searchError: null,
    });
  },

  // Pagination Actions
  setSearchPagination: (pagination: {
    totalResults: number;
    currentPage: number;
    pageSize: number;
    hasMore: boolean;
  }) => {
    set({
      totalSearchResults: pagination.totalResults,
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      hasMoreResults: pagination.hasMore,
    });
  },

  nextPage: () => {
    set((state) => ({
      currentPage: state.currentPage + 1,
    }));
  },

  previousPage: () => {
    set((state) => ({
      currentPage: Math.max(0, state.currentPage - 1),
    }));
  },

  setPageSize: (size: number) => {
    set({
      pageSize: size,
      currentPage: 0, // Reset to first page when changing page size
    });
  },

  // Utility Actions
  reset: () => {
    set(initialState);
  },

  resetSearch: () => {
    set({
      searchResults: [],
      searchQuery: '',
      totalSearchResults: 0,
      currentPage: 0,
      hasMoreResults: false,
      searchError: null,
      isSearching: false,
    });
  },

  // Getters
  getState: () => get(),

  getIdentifierTypeByUuid: (uuid: string) => {
    const state = get();
    return state.identifierTypes.find(type => type.uuid === uuid);
  },

  getPersonAttributeTypeByUuid: (uuid: string) => {
    const state = get();
    return state.personAttributeTypes.find(type => type.uuid === uuid);
  },

  getRelationshipTypeByUuid: (uuid: string) => {
    const state = get();
    return state.relationshipTypes.find(type => type.uuid === uuid);
  },

  getLocationByUuid: (uuid: string) => {
    const state = get();
    return state.locations.find(location => location.uuid === uuid);
  },
}));

// Selector hooks for specific data
export const useRegistrationConfig = () => {
  const {
    identifierTypes,
    personAttributeTypes,
    relationshipTypes,
    addressHierarchy,
    locations,
    isLoadingConfig
  } = useRegistrationStore();

  return {
    identifierTypes,
    personAttributeTypes,
    relationshipTypes,
    addressHierarchy,
    locations,
    isLoadingConfig,
  };
};

export const usePatientSearch = () => {
  const {
    searchResults,
    searchQuery,
    isSearching,
    searchError,
    totalSearchResults,
    currentPage,
    pageSize,
    hasMoreResults,
  } = useRegistrationStore();

  return {
    searchResults,
    searchQuery,
    isSearching,
    searchError,
    totalSearchResults,
    currentPage,
    pageSize,
    hasMoreResults,
  };
};

export const useCurrentPatient = () => {
  const {
    currentPatient,
    isLoading,
    isSaving,
    error
  } = useRegistrationStore();

  return {
    currentPatient,
    isLoading,
    isSaving,
    error,
  };
};

export default useRegistrationStore;
