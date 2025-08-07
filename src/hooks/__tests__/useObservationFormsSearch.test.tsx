import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import * as commonUtils from '@utils/common';
import useObservationFormsSearch from '../useObservationFormsSearch';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the common utils
jest.mock('@utils/common', () => ({
  getFormattedError: jest.fn(),
}));

// Mock useDebounce to return value immediately for testing
jest.mock('../useDebounce', () => ({
  __esModule: true,
  default: jest.fn((value) => value),
}));

// Test wrapper with i18n provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('useObservationFormsSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (commonUtils.getFormattedError as jest.Mock).mockReturnValue({
      title: 'Error',
      message: 'Something went wrong',
    });
  });

  it('should fetch and return observation forms successfully', async () => {
    const mockFormsData = {
      results: [
        {
          name: 'Patient History Form',
          uuid: 'form-uuid-1',
          version: '1.0',
          formName: 'Patient History Form',
          formUuid: 'form-uuid-1',
        },
        {
          name: 'Physical Examination Form',
          uuid: 'form-uuid-2',
          version: '2.0',
        },
      ],
    };

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
      },
      {
        name: 'Physical Examination Form',
        uuid: 'form-uuid-2',
        version: '2.0',
        formName: undefined,
        formUuid: undefined,
      },
    ]);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      '/openmrs/ws/rest/v1/bahmniie/form/latestPublishedForms',
    );
  });

  it('should filter forms based on search term (case-insensitive)', async () => {
    const mockFormsData = {
      results: [
        {
          name: 'Patient History Form',
          uuid: 'form-uuid-1',
          version: '1.0',
        },
        {
          name: 'Physical Examination Form',
          uuid: 'form-uuid-2',
          version: '2.0',
        },
        {
          name: 'Laboratory Results',
          uuid: 'form-uuid-3',
          version: '1.0',
          formName: 'Patient Lab Results',
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFormsData,
    });

    const { result } = renderHook(() => useObservationFormsSearch('PATIENT'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should match forms containing "patient" in name or formName
    expect(result.current.forms).toHaveLength(2);
    expect(result.current.forms[0].name).toBe('Patient History Form');
    expect(result.current.forms[1].name).toBe('Laboratory Results');
  });

  it('should handle multi-word search terms', async () => {
    const mockFormsData = {
      results: [
        {
          name: 'Patient History Form',
          uuid: 'form-uuid-1',
          version: '1.0',
        },
        {
          name: 'Physical Examination Form',
          uuid: 'form-uuid-2',
          version: '2.0',
        },
      ],
    };

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
    expect(result.current.forms).toHaveLength(1);
    expect(result.current.forms[0].name).toBe('Patient History Form');
  });

  it('should return all forms when search term is empty or whitespace', async () => {
    const mockFormsData = {
      results: [
        {
          name: 'Form 1',
          uuid: 'form-uuid-1',
          version: '1.0',
        },
        {
          name: 'Form 2',
          uuid: 'form-uuid-2',
          version: '2.0',
        },
      ],
    };

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

    expect(result.current.forms).toHaveLength(2);
  });

  it('should set default version when not provided', async () => {
    const mockFormsData = {
      results: [
        {
          name: 'Form Without Version',
          uuid: 'form-uuid-1',
        },
      ],
    };

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

    expect(result.current.forms[0].version).toBe('1.0');
  });
});
