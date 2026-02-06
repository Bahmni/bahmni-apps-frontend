import {
  getCurrentUserPrivileges,
  fetchObservationForms,
} from '@bahmni/services';
import { UserPrivilegeProvider } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n from '../../../setupTests.i18n';

import { filterFormsByUserPrivileges } from '../../components/forms/observations/utils/privilegeUtils';
import useObservationFormsSearch from '../useObservationFormsSearch';

// Mock the common utils
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getCurrentUserPrivileges: jest.fn(),
  fetchObservationForms: jest.fn(),
}));

// Mock the local privilegeUtils
jest.mock('../../components/forms/observations/utils/privilegeUtils', () => ({
  filterFormsByUserPrivileges: jest.fn(),
}));

// Mock useUserPrivilege hook
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(() => ({
    userPrivileges: [
      { name: 'app:clinical:observationForms' },
      { name: 'app:clinical:locationpicker' },
    ],
  })),
}));

// Mock useDebounce to return value immediately for testing
jest.mock('../useDebounce', () => ({
  __esModule: true,
  default: jest.fn((value) => value),
}));

// Mock data shared across all tests
const mockFormsData = [
  {
    name: 'Patient History Form',
    uuid: 'form-uuid-1',
    id: 1,
    privileges: [
      {
        privilegeName: 'app:clinical:observationForms',
        editable: true,
      },
    ],
  },
  {
    name: 'Physical Examination Form',
    uuid: 'form-uuid-2',
    id: 2,
    privileges: [
      {
        privilegeName: 'app:clinical:physicalExam',
        editable: true,
      },
    ],
  },
  {
    name: 'Laboratory Results',
    uuid: 'form-uuid-3',
    id: 3,
    privileges: [],
  },
];

describe('useObservationFormsSearch', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
          gcTime: Infinity,
        },
      },
    });

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <UserPrivilegeProvider>{children}</UserPrivilegeProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );
    Wrapper.displayName = 'TestWrapper';
    return Wrapper;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset useUserPrivilege mock to default state
    const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: [
        { name: 'app:clinical:observationForms' },
        { name: 'app:clinical:locationpicker' },
      ],
    });

    // Mock privilege service
    (getCurrentUserPrivileges as jest.Mock).mockResolvedValue([
      { name: 'app:clinical:observationForms' },
      { name: 'app:clinical:locationpicker' },
    ]);

    // Mock privilege utils to return filtered forms
    (filterFormsByUserPrivileges as jest.Mock).mockImplementation(
      (privileges, forms) => forms,
    );

    // Mock observation forms service
    (fetchObservationForms as jest.Mock).mockResolvedValue(mockFormsData);
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe('basic functionality', () => {
    it('should call fetchObservationForms service when hook is used', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.forms).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for forms to be loaded
      await waitFor(() => {
        expect(result.current.forms).toEqual(mockFormsData);
      });

      expect(result.current.error).toBeNull();
      expect(fetchObservationForms).toHaveBeenCalledTimes(1);
    });
  });

  describe('privilege filtering', () => {
    it('should return empty array when user privileges are null (loading)', async () => {
      // Mock useUserPrivilege to return null privileges
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: null,
      });

      (getCurrentUserPrivileges as jest.Mock).mockResolvedValue(null);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should return empty array when privileges are null
      expect(result.current.forms).toEqual([]);
    });

    it('should filter forms based on user privileges', async () => {
      const mockPrivileges = [{ name: 'app:clinical:observationForms' }];

      // Mock useUserPrivilege to return specific privileges
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: mockPrivileges,
      });

      (getCurrentUserPrivileges as jest.Mock).mockResolvedValue(mockPrivileges);

      // Mock privilege utils to return only forms user has access to
      (filterFormsByUserPrivileges as jest.Mock).mockReturnValue([
        mockFormsData[0], // Only first form
      ]);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.forms).toHaveLength(1);
      expect(result.current.forms[0].name).toBe('Patient History Form');
      expect(filterFormsByUserPrivileges).toHaveBeenCalledWith(
        mockPrivileges,
        mockFormsData,
      );
    });

    it('should return empty array when user has no privileges', async () => {
      (getCurrentUserPrivileges as jest.Mock).mockResolvedValue([]);

      (filterFormsByUserPrivileges as jest.Mock).mockReturnValue([]);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.forms).toEqual([]);
    });
  });

  describe('episodeUuids filtering', () => {
    it('should pass episodeUuids array to fetchObservationForms', async () => {
      const episodeUuids = ['uuid-1', 'uuid-2'];

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useObservationFormsSearch('', episodeUuids),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchObservationForms).toHaveBeenCalledWith(['uuid-1', 'uuid-2']);
    });

    it('should pass empty array when episodeUuids is empty', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useObservationFormsSearch('', []), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchObservationForms).toHaveBeenCalledWith([]);
    });

    it('should pass undefined when episodeUuids is not provided', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchObservationForms).toHaveBeenCalledWith(undefined);
    });
  });

  describe('search functionality', () => {
    beforeEach(() => {
      // Mock privilege filtering to return all forms for search tests
      (filterFormsByUserPrivileges as jest.Mock).mockImplementation(
        (privileges, forms) => forms,
      );
    });

    it('should filter forms based on search term (case-insensitive)', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useObservationFormsSearch('PATIENT'),
        {
          wrapper,
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should match forms containing "patient" in name
      expect(result.current.forms).toHaveLength(1);
      expect(result.current.forms[0].name).toBe('Patient History Form');
    });

    it('should handle multi-word search terms', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useObservationFormsSearch('patient history'),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.forms).toHaveLength(1);
      expect(result.current.forms[0].name).toBe('Patient History Form');
    });

    it('should return all forms when search term is empty or whitespace', async () => {
      const wrapper = createWrapper();
      const { result: emptyResult } = renderHook(
        () => useObservationFormsSearch(''),
        { wrapper },
      );

      await waitFor(() => {
        expect(emptyResult.current.isLoading).toBe(false);
      });

      expect(emptyResult.current.forms).toHaveLength(3);

      // Test whitespace-only search
      const wrapper2 = createWrapper();
      const { result: whitespaceResult } = renderHook(
        () => useObservationFormsSearch('   '),
        { wrapper: wrapper2 },
      );

      await waitFor(() => {
        expect(whitespaceResult.current.isLoading).toBe(false);
      });

      expect(whitespaceResult.current.forms).toHaveLength(3);
    });

    it('should search in name field only', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useObservationFormsSearch('examination'),
        {
          wrapper,
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should match only the form with "examination" in name
      expect(result.current.forms).toHaveLength(1);
      expect(result.current.forms[0].name).toBe('Physical Examination Form');
    });

    it('should handle search with no matches', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useObservationFormsSearch('nonexistent'),
        {
          wrapper,
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.forms).toHaveLength(0);
    });

    it('should handle partial word matches', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useObservationFormsSearch('lab'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should match "Laboratory Results"
      expect(result.current.forms).toHaveLength(1);
      expect(result.current.forms[0].name).toBe('Laboratory Results');
    });
  });
});
