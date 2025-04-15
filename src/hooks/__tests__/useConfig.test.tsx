import React from 'react';
import { renderHook } from '@testing-library/react';
import { useConfig } from '../useConfig';
import { ConfigContextType } from '../../types/config';
import { ConfigProvider } from '@providers/ConfigProvider';

// Mock notification service
jest.mock('@services/notificationService', () => ({
  showError: jest.fn(),
}));

// Wrapper component to provide the ConfigContext
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider>{children}</ConfigProvider>
);

describe('useConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the context values with department ID to URL mapping', () => {
    // Mock context value with Record<string, string> for config
    const mockContextValue: ConfigContextType = {
      config: {
        dept1: 'http://example.com/dept1',
        dept2: 'http://example.com/dept2',
      },
      setConfig: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    };

    // Mock the ConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useConfig(), { wrapper });

    // Verify the hook returns the context values
    expect(result.current).toEqual(mockContextValue);
    expect(result.current.config).toEqual({
      dept1: 'http://example.com/dept1',
      dept2: 'http://example.com/dept2',
    });
  });

  it('should handle error state correctly', () => {
    const mockError = new Error('Config error');

    // Mock context value with error
    const mockContextValue: ConfigContextType = {
      config: null,
      setConfig: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: mockError,
      setError: jest.fn(),
    };

    // Mock the ConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useConfig(), { wrapper });

    // Verify the hook returns the error state
    expect(result.current.error).toEqual(mockError);
    expect(result.current.config).toBeNull();
  });

  it('should throw an error when used outside of ConfigProvider', () => {
    // Suppress console.error for this test to avoid noisy output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Mock the ConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(null);

    // Expect the hook to throw an error when used without a provider
    expect(() => {
      renderHook(() => useConfig());
    }).toThrow('useConfig must be used within a ConfigProvider');

    // Restore console.error
    console.error = originalConsoleError;
  });
});
