import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n from '@/setupTests.i18n';
import { UserPrivilegeProvider } from '@providers/UserPrivilegeProvider';
import * as observationFormsService from '@services/observationFormsService';
import * as privilegeService from '@services/privilegeService';
import * as commonUtils from '@utils/common';
import * as privilegeUtils from '@utils/privilegeUtils';

import useObservationFormsSearch from '../useObservationFormsSearch';

// Mock the common utils
jest.mock('@utils/common', () => ({
  getFormattedError: jest.fn(),
}));

// Mock privilege service
jest.mock('@services/privilegeService');

// Mock observation forms service
jest.mock('@services/observationFormsService', () => ({
  fetchObservationForms: jest.fn(),
}));

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

    // Mock observation forms service
    (
      observationFormsService.fetchObservationForms as jest.Mock
    ).mockResolvedValue(mockFormsData);
  });

  describe('basic functionality', () => {
    it('should call fetchObservationForms service when hook is used', async () => {
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

      expect(result.current.forms).toEqual(mockFormsData);
      expect(result.current.error).toBeNull();
      expect(
        observationFormsService.fetchObservationForms,
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle service error with fallback error message when formatted error has no message', async () => {
      const serviceError = new Error('Service error');
      (
        observationFormsService.fetchObservationForms as jest.Mock
      ).mockRejectedValue(serviceError);

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

  describe('privilege filtering', () => {
    it('should return empty array when user privileges are null (loading)', async () => {
      (
        privilegeService.getCurrentUserPrivileges as jest.Mock
      ).mockResolvedValue(null);

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
          mockFormsData[0], // Only first form
        ],
      );

      const { result } = renderHook(() => useObservationFormsSearch(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.forms).toHaveLength(1);
      expect(result.current.forms[0].name).toBe('Patient History Form');
      expect(privilegeUtils.filterFormsByUserPrivileges).toHaveBeenCalledWith(
        mockPrivileges,
        mockFormsData,
      );
    });

    it('should return empty array when user has no privileges', async () => {
      (
        privilegeService.getCurrentUserPrivileges as jest.Mock
      ).mockResolvedValue([]);

      (privilegeUtils.filterFormsByUserPrivileges as jest.Mock).mockReturnValue(
        [],
      );

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
      const { result: emptyResult } = renderHook(
        () => useObservationFormsSearch(''),
        { wrapper },
      );

      await waitFor(() => {
        expect(emptyResult.current.isLoading).toBe(false);
      });

      expect(emptyResult.current.forms).toHaveLength(3);

      // Test whitespace-only search
      const { result: whitespaceResult } = renderHook(
        () => useObservationFormsSearch('   '),
        { wrapper },
      );

      await waitFor(() => {
        expect(whitespaceResult.current.isLoading).toBe(false);
      });

      expect(whitespaceResult.current.forms).toHaveLength(3);
    });

    it('should search in name field only', async () => {
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
