import React from 'react';
import { renderHook } from '@testing-library/react';
import { useDashboardConfig } from '../useDashboardConfig';
import {
  DashboardConfigContextType,
  DashboardConfig,
} from '@types/dashboardConfig';
import { DashboardConfigProvider } from '@providers/DashboardConfigProvider';

// Mock notification service
jest.mock('@services/notificationService', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
  __esModule: true,
  default: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  },
}));

// Mock configService
jest.mock('@services/configService', () => ({
  getDashboardConfig: jest.fn(),
}));

// Wrapper component to provide the DashboardConfigContext
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DashboardConfigProvider dashboardURL="test-dashboard">
    {children}
  </DashboardConfigProvider>
);

describe('useDashboardConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the context values correctly', () => {
    // Mock dashboard config
    const mockDashboardConfig: DashboardConfig = {
      sections: [
        {
          name: 'Vitals',
          icon: 'heartbeat',
          translationKey: 'DASHBOARD_VITALS_KEY',
          controls: [],
        },
        {
          name: 'Medications',
          icon: 'pills',
          controls: [],
        },
      ],
    };

    // Mock context value
    const mockContextValue: DashboardConfigContextType = {
      dashboardConfig: mockDashboardConfig,
      isLoading: false,
      error: null,
    };

    // Mock the DashboardConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useDashboardConfig());

    // Verify the hook returns the context values
    expect(result.current).toEqual(mockContextValue);
    expect(result.current.dashboardConfig).toEqual(mockDashboardConfig);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading state correctly', () => {
    // Mock context value with loading state
    const mockContextValue: DashboardConfigContextType = {
      dashboardConfig: null,
      isLoading: true,
      error: null,
    };

    // Mock the DashboardConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useDashboardConfig());

    // Verify the hook returns the loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.dashboardConfig).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle error state correctly', () => {
    const mockError = new Error('Dashboard config error');

    // Mock context value with error
    const mockContextValue: DashboardConfigContextType = {
      dashboardConfig: null,
      isLoading: false,
      error: mockError,
    };

    // Mock the DashboardConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useDashboardConfig());

    // Verify the hook returns the error state
    expect(result.current.error).toEqual(mockError);
    expect(result.current.dashboardConfig).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should throw an error when used outside of DashboardConfigProvider', () => {
    // Mock the DashboardConfigContext to return undefined (simulating use outside provider)
    jest.spyOn(React, 'useContext').mockReturnValue(undefined);

    // Expect the hook to throw an error when used without a provider
    expect(() => {
      renderHook(() => useDashboardConfig());
    }).toThrow(
      'useDashboardConfig must be used within a DashboardConfigProvider',
    );
  });

  it('should work with the actual provider', () => {
    const { result } = renderHook(() => useDashboardConfig(), { wrapper });

    // With the actual provider, we should get a valid context
    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty('dashboardConfig');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });

  it('should handle empty dashboard config', () => {
    // Mock context value with empty dashboard config
    const mockContextValue: DashboardConfigContextType = {
      dashboardConfig: { sections: [] },
      isLoading: false,
      error: null,
    };

    // Mock the DashboardConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useDashboardConfig());

    // Verify the hook returns the empty dashboard config
    expect(result.current.dashboardConfig).toEqual({ sections: [] });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle null dashboard config', () => {
    // Mock context value with null dashboard config
    const mockContextValue: DashboardConfigContextType = {
      dashboardConfig: null,
      isLoading: false,
      error: null,
    };

    // Mock the DashboardConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useDashboardConfig());

    // Verify the hook returns null dashboard config
    expect(result.current.dashboardConfig).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
