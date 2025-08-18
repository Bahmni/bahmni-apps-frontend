import { renderHook, act } from '@testing-library/react';
import { validDashboardConfig } from '../../__mocks__/configMocks';
import { getDashboardConfig } from '@bahmni-frontend/bahmni-services';
import { useDashboardConfig } from '../useDashboardConfig';

// Mock notification service
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  getDashboardConfig: jest.fn(),
  getFormattedError: jest.fn((error) => ({
      title: 'Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    })),
    notificationService: {
      showError: jest.fn(),
      showSuccess: jest.fn(),
      showInfo: jest.fn(),
      showWarning: jest.fn(),
    },
  __esModule: true
}));

describe('useDashboardConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch and return dashboard config correctly', async () => {
    // Mock the getDashboardConfig function
    (getDashboardConfig as jest.Mock).mockResolvedValue(validDashboardConfig);

    // Render the hook with a dashboard URL
    const { result } = renderHook(
      (props) => useDashboardConfig(props.dashboardURL),
      {
        initialProps: { dashboardURL: 'test-dashboard' },
      },
    );

    // Initially, it should be in loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.dashboardConfig).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for the async operation to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // After loading, it should have the dashboard config
    expect(result.current.isLoading).toBe(false);
    expect(result.current.dashboardConfig).toEqual(validDashboardConfig);
    expect(result.current.error).toBeNull();

    // Verify getDashboardConfig was called with the correct URL
    expect(getDashboardConfig).toHaveBeenCalledWith('test-dashboard');
  });

  it('should handle loading state correctly', async () => {
    // Mock the getDashboardConfig function to delay the response
    (getDashboardConfig as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100)),
    );

    // Render the hook
    const { result } = renderHook(() => useDashboardConfig('test-dashboard'));

    // Initially, it should be in loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.dashboardConfig).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle error state correctly', async () => {
    const mockError = new Error('Dashboard config error');

    // Mock the getDashboardConfig function to throw an error
    (getDashboardConfig as jest.Mock).mockRejectedValue(mockError);

    // Render the hook
    const { result } = renderHook(() => useDashboardConfig('test-dashboard'));

    // Initially, it should be in loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.dashboardConfig).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for the async operation to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // After error, it should have the error state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.dashboardConfig).toBeNull();
    expect(result.current.error).toBeDefined();
  });

  it('should refetch when dashboardURL changes', async () => {
    // Mock the getDashboardConfig function
    (getDashboardConfig as jest.Mock).mockResolvedValue({
      sections: [],
    });

    // Render the hook with initial props
    const { rerender } = renderHook(
      (props) => useDashboardConfig(props.dashboardURL),
      {
        initialProps: { dashboardURL: 'test-dashboard-1' },
      },
    );

    // Wait for the first fetch to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify getDashboardConfig was called with the first URL
    expect(getDashboardConfig).toHaveBeenCalledWith('test-dashboard-1');
    expect(getDashboardConfig).toHaveBeenCalledTimes(1);

    // Rerender with a different dashboardURL
    rerender({ dashboardURL: 'test-dashboard-2' });

    // Wait for the second fetch to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify getDashboardConfig was called with the second URL
    expect(getDashboardConfig).toHaveBeenCalledWith('test-dashboard-2');
    expect(getDashboardConfig).toHaveBeenCalledTimes(2);
  });

  it('should handle empty dashboard config', async () => {
    // Mock the getDashboardConfig function to return empty config
    (getDashboardConfig as jest.Mock).mockResolvedValue({ sections: [] });

    // Render the hook
    const { result } = renderHook(() => useDashboardConfig('test-dashboard'));

    // Wait for the async operation to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify the hook returns the empty dashboard config
    expect(result.current.dashboardConfig).toEqual({ sections: [] });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle null dashboard config', async () => {
    // Mock the getDashboardConfig function to return null
    (getDashboardConfig as jest.Mock).mockResolvedValue(null);

    // Render the hook
    const { result } = renderHook(() => useDashboardConfig('test-dashboard'));

    // Wait for the async operation to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify the hook returns null dashboard config
    expect(result.current.dashboardConfig).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle null URL parameter', async () => {
    // Reset mock to track calls
    (getDashboardConfig as jest.Mock).mockReset();

    // Render the hook with null URL
    const { result } = renderHook(() => useDashboardConfig(null));

    // Should immediately return null config without loading state
    expect(result.current.dashboardConfig).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Wait a tick to ensure any potential async operations would have started
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify getDashboardConfig was not called at all
    expect(getDashboardConfig).not.toHaveBeenCalled();

    // State should remain the same
    expect(result.current.dashboardConfig).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
