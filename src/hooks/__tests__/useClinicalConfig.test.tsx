import React from 'react';
import { renderHook } from '@testing-library/react';
import { useClinicalConfig } from '../useClinicalConfig';
import { ClinicalConfigContextType } from '@types/config';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';

// Mock notification service
jest.mock('@services/notificationService', () => ({
  showError: jest.fn(),
}));

// Wrapper component to provide the ClinicalConfigContext
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ClinicalConfigProvider>{children}</ClinicalConfigProvider>
);

describe('useClinicalConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the context values with department ID to URL mapping', () => {
    // Mock context value with Record<string, string> for config
    const mockContextValue: ClinicalConfigContextType = {
      clinicalConfig: {
        dashboards: [
          {
            name: 'Department 1',
            url: 'http://example.com/dept1',
            requiredPrivileges: [],
          },
          {
            name: 'Department 2',
            url: 'http://example.com/dept2',
            requiredPrivileges: [],
          },
        ],
        patientInformation: {},
        actions: [],
      },
      setClinicalConfig: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    };

    // Mock the ClinicalConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useClinicalConfig(), { wrapper });

    // Verify the hook returns the context values
    expect(result.current).toEqual(mockContextValue);
    expect(result.current.clinicalConfig).toEqual({
      dashboards: [
        {
          name: 'Department 1',
          url: 'http://example.com/dept1',
          requiredPrivileges: [],
        },
        {
          name: 'Department 2',
          url: 'http://example.com/dept2',
          requiredPrivileges: [],
        },
      ],
      patientInformation: {},
      actions: [],
    });
  });

  it('should handle error state correctly', () => {
    const mockError = new Error('Config error');

    // Mock context value with error
    const mockContextValue: ClinicalConfigContextType = {
      clinicalConfig: null,
      setClinicalConfig: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: mockError,
      setError: jest.fn(),
    };

    // Mock the ClinicalConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useClinicalConfig(), { wrapper });

    // Verify the hook returns the error state
    expect(result.current.error).toEqual(mockError);
    expect(result.current.clinicalConfig).toBeNull();
  });

  it('should throw an error when used outside of ClinicalConfigProvider', () => {
    // Suppress console.error for this test to avoid noisy output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock the ClinicalConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(null);

    // Expect the hook to throw an error when used without a provider
    expect(() => {
      renderHook(() => useClinicalConfig());
    }).toThrow(
      'useClinicalConfig must be used within a ClinicalConfigProvider',
    );
  });
});
