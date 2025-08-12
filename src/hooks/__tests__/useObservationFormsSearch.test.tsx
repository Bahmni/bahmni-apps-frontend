import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n from '@/setupTests.i18n';
import { UserPrivilegeProvider } from '@providers/UserPrivilegeProvider';
import * as privilegeService from '@services/privilegeService';
import * as commonUtils from '@utils/common';
import * as privilegeUtils from '@utils/privilegeUtils';

import useObservationFormsSearch from '../useObservationFormsSearch';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the common utils
jest.mock('@utils/common', () => ({
  getFormattedError: jest.fn(),
}));

// Mock privilege service
jest.mock('@services/privilegeService');

// Mock privilege utils
jest.mock('@utils/privilegeUtils', () => ({
  filterFormsByUserPrivileges: jest.fn(),
}));

// Mock useDebounce to return value immediately for testing
jest.mock('../useDebounce', () => ({
  __esModule: true,
  default: jest.fn((value) => value),
}));

// Test wrapper with i18n and privilege providers
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <UserPrivilegeProvider>{children}</UserPrivilegeProvider>
  </I18nextProvider>
);

describe('useObservationFormsSearch', () => {
  const mockFormsData = {
    results: [
      {
        name: 'Patient History Form',
        uuid: 'form-uuid-1',
        version: '1.0',
        formName: 'Patient History Form',
        formUuid: 'form-uuid-1',
        privileges: ['app:clinical:observationForms'],
      },
      {
        name: 'Physical Examination Form',
        uuid: 'form-uuid-2',
        version: '2.0',
        privileges: ['app:clinical:physicalExam'],
      },
      {
        name: 'Laboratory Results',
        uuid: 'form-uuid-3',
        version: '1.0',
        formName: 'Patient Lab Results',
        privileges: [],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (commonUtils.getFormattedError as jest.Mock).mockReturnValue({
      title: 'Error',
      message: 'Something went wrong',
    });

    // Mock privilege service
    (privilegeService.getCurrentUserPrivileges as jest.Mock).mockResolvedValue([
      { name: 'app:clinical:observationForms' },
      { name: 'app:clinical:locationpicker' },
    ]);

    // Mock privilege utils to return filtered forms
    (
      privilegeUtils.filterFormsByUserPrivileges as jest.Mock
    ).mockImplementation((privileges, forms) => forms);
  });

  describe('basic functionality', () => {
    it('should fetch and return observation forms successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsData,
      });

      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.forms).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for API call to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.forms).toEqual([
        {
          name: 'Patient History Form',
          uuid: 'form-uuid-1',
          version: '1.0',
          formName: 'Patient History Form',
          formUuid: 'form-uuid-1',
          id: 0,
          nameTranslation: '[]',
          privileges: ['app:clinical:observationForms'],
          published: true,
          resources: null,
        },
        {
          name: 'Physical Examination Form',
          uuid: 'form-uuid-2',
          version: '2.0',
          formName: undefined,
          formUuid: undefined,
          id: 0,
          nameTranslation: '[]',
          privileges: ['app:clinical:physicalExam'],
          published: true,
          resources: null,
        },
        {
          name: 'Laboratory Results',
          uuid: 'form-uuid-3',
          version: '1.0',
          formName: 'Patient Lab Results',
          formUuid: undefined,
          id: 0,
          nameTranslation: '[]',
          privileges: [],
          published: true,
          resources: null,
        },
      ]);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/bahmniie/form/latestPublishedForms',
      );
    });
  });

  describe('privilege filtering', () => {
    it('should return empty array when user privileges are null (loading)', async () => {
      (
        privilegeService.getCurrentUserPrivileges as jest.Mock
      ).mockResolvedValue(null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsData,
      });

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
      (
        privilegeService.getCurrentUserPrivileges as jest.Mock
      ).mockResolvedValue(mockPrivileges);

      // Mock privilege utils to return only forms user has access to
      (privilegeUtils.filterFormsByUserPrivileges as jest.Mock).mockReturnValue(
        [
          {
            name: 'Patient History Form',
            uuid: 'form-uuid-1',
            version: '1.0',
            formName: 'Patient History Form',
            formUuid: 'form-uuid-1',
            id: 0,
            nameTranslation: '[]',
            privileges: ['app:clinical:observationForms'],
            published: true,
            resources: null,
          },
        ],
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsData,
      });

      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.forms).toHaveLength(1);
      expect(result.current.forms[0].name).toBe('Patient History Form');
    });

    it('should return empty array when user has no privileges', async () => {
      (
        privilegeService.getCurrentUserPrivileges as jest.Mock
      ).mockResolvedValue([]);

      (privilegeUtils.filterFormsByUserPrivileges as jest.Mock).mockReturnValue(
        [],
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsData,
      });

      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.forms).toEqual([]);
    });
  });

  describe('search functionality', () => {
    beforeEach(() => {
      // Mock privilege filtering to return all forms for search tests
      (
        privilegeUtils.filterFormsByUserPrivileges as jest.Mock
      ).mockImplementation((privileges, forms) => forms);
    });

    it('should filter forms based on search term (case-insensitive)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsData,
      });

      const { result } = renderHook(
        () => useObservationFormsSearch('PATIENT'),
        {
          wrapper,
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should match forms containing "patient" in name or formName
      expect(result.current.forms).toHaveLength(2);
      expect(result.current.forms[0].name).toBe('Patient History Form');
      expect(result.current.forms[1].name).toBe('Laboratory Results');
    });

    it('should handle multi-word search terms', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsData,
      });

      const { result } = renderHook(
        () => useObservationFormsSearch('patient history'),
        {
          wrapper,
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should match forms containing either "patient" or "history"
      expect(result.current.forms).toHaveLength(2);
      expect(result.current.forms[0].name).toBe('Patient History Form');
      expect(result.current.forms[1].name).toBe('Laboratory Results');
    });

    it('should return all forms when search term is empty or whitespace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsData,
      });

      const { result } = renderHook(() => useObservationFormsSearch('   '), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.forms).toHaveLength(3);
    });

    it('should search in both name and formName fields', async () => {
      const searchFormsData = {
        results: [
          {
            name: 'Form A',
            uuid: 'form-uuid-1',
            version: '1.0',
            formName: 'Patient Registration',
          },
          {
            name: 'Patient Details',
            uuid: 'form-uuid-2',
            version: '1.0',
            formName: 'Form B',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => searchFormsData,
      });

      const { result } = renderHook(
        () => useObservationFormsSearch('patient'),
        {
          wrapper,
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should match both forms - one by formName, one by name
      expect(result.current.forms).toHaveLength(2);
    });

    it('should handle search with no matches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsData,
      });

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
  });

  describe('error handling', () => {
    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Something went wrong');
      expect(result.current.forms).toEqual([]);
      expect(commonUtils.getFormattedError).toHaveBeenCalledWith(
        new Error('HTTP error! status: 404'),
      );
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.forms).toEqual([]);
    });
  });
});
