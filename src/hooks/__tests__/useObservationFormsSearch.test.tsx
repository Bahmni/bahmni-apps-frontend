import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';

import { OBSERVATION_FORMS_URL } from '@/constants/app';
import i18n from '@/setupTests.i18n';
import { UserPrivilegeProvider } from '@providers/UserPrivilegeProvider';
import * as privilegeService from '@services/privilegeService';
import * as translationService from '@services/translationService';
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

// Mock translation service
jest.mock('@services/translationService', () => ({
  getUserPreferredLocale: jest.fn(),
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

// Mock data shared across all tests
const mockFormsData = {
  results: [
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
      nameTranslation:
        '[{"display":"Formulario de Historia del Paciente","locale":"es"},{"display":"Patient History Form","locale":"en"}]',
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
      nameTranslation:
        '[{"display":"Formulario de Examen Físico","locale":"es"}]',
    },
    {
      name: 'Laboratory Results',
      uuid: 'form-uuid-3',
      id: 3,
      privileges: [],
      nameTranslation: '',
    },
  ],
};
describe('useObservationFormsSearch', () => {
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

    // Mock translation service to return English by default
    (translationService.getUserPreferredLocale as jest.Mock).mockReturnValue(
      'en',
    );
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
      ]);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(OBSERVATION_FORMS_URL);
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
            id: 1,
            privileges: [
              {
                privilegeName: 'app:clinical:observationForms',
                editable: true,
              },
            ],
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

      // Should match forms containing "patient" in name
      expect(result.current.forms).toHaveLength(1);
      expect(result.current.forms[0].name).toBe('Patient History Form');
    });

    it('should handle multi-word search terms and empty search', async () => {
      // Test multi-word search
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsData,
      });

      const { result: multiWordResult } = renderHook(
        () => useObservationFormsSearch('patient history'),
        { wrapper },
      );

      await waitFor(() => {
        expect(multiWordResult.current.isLoading).toBe(false);
      });

      expect(multiWordResult.current.forms).toHaveLength(1);
      expect(multiWordResult.current.forms[0].name).toBe(
        'Patient History Form',
      );

      // Test empty search returns all forms
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsData,
      });

      const { result: emptyResult } = renderHook(
        () => useObservationFormsSearch('   '),
        {
          wrapper,
        },
      );

      await waitFor(() => {
        expect(emptyResult.current.isLoading).toBe(false);
      });

      expect(emptyResult.current.forms).toHaveLength(3);
    });

    it('should search in name field only', async () => {
      const searchFormsData = {
        results: [
          {
            name: 'Form A',
            uuid: 'form-uuid-1',
            id: 1,
            privileges: [],
          },
          {
            name: 'Patient Details',
            uuid: 'form-uuid-2',
            id: 2,
            privileges: [],
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

      // Should match only the form with "patient" in name
      expect(result.current.forms).toHaveLength(1);
      expect(result.current.forms[0].name).toBe('Patient Details');
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

    it('should handle network errors with fallback error message when formatted error has no message', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      // Mock getFormattedError to return null message to test fallback
      (commonUtils.getFormattedError as jest.Mock).mockReturnValue({
        title: 'Error',
        message: null,
      });

      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toBe(
        'An unexpected error occurred. Please try again later.',
      );
      expect(result.current.forms).toEqual([]);
    });
  });

  describe('data handling', () => {
    it('should handle API response where results is undefined but data is truthy', async () => {
      // Test line 60: data.results ?? data ?? []
      // When data.results is undefined but data itself is an array
      const mockDataArray = [
        {
          uuid: 'form-2',
          name: 'Fallback Form Undefined',
          id: 2,
          privileges: [{ privilegeName: 'app:clinical', editable: true }],
        },
      ];

      // Create object with undefined results property but truthy data
      const mockData = Object.assign(mockDataArray, { results: undefined });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.forms).toHaveLength(1);
      expect(result.current.forms[0].name).toBe('Fallback Form Undefined');
    });
  });
});

describe('name translation functionality', () => {
  beforeEach(() => {
    // Mock privilege filtering to return all forms for translation tests
    (
      privilegeUtils.filterFormsByUserPrivileges as jest.Mock
    ).mockImplementation((privileges, forms) => forms);
  });

  it('should use translated names when locale matches and translations are available', async () => {
    // Mock Spanish locale
    (translationService.getUserPreferredLocale as jest.Mock).mockReturnValue(
      'es',
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

    // Should use Spanish translations where available
    expect(result.current.forms).toEqual([
      {
        name: 'Formulario de Historia del Paciente', // Spanish translation
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
        name: 'Formulario de Examen Físico', // Spanish translation
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
        name: 'Laboratory Results', // Fallback to original name (no translation)
        uuid: 'form-uuid-3',
        id: 3,
        privileges: [],
      },
    ]);
  });

  it('should fallback to original name when locale has no translation', async () => {
    // Mock French locale (not available in translations)
    (translationService.getUserPreferredLocale as jest.Mock).mockReturnValue(
      'fr',
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

    // Should use original names when no translation available for locale
    expect(result.current.forms).toEqual([
      {
        name: 'Patient History Form', // Original name
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
        name: 'Physical Examination Form', // Original name
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
        name: 'Laboratory Results', // Original name
        uuid: 'form-uuid-3',
        id: 3,
        privileges: [],
      },
    ]);
  });
  it('should search translated names correctly', async () => {
    // Mock Spanish locale
    (translationService.getUserPreferredLocale as jest.Mock).mockReturnValue(
      'es',
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFormsData,
    });

    // Search for Spanish term
    const { result } = renderHook(
      () => useObservationFormsSearch('formulario'),
      {
        wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should match forms with "formulario" in Spanish translation
    expect(result.current.forms).toHaveLength(2);
    expect(result.current.forms[0].name).toBe(
      'Formulario de Historia del Paciente',
    );
    expect(result.current.forms[1].name).toBe('Formulario de Examen Físico');
  });
});
