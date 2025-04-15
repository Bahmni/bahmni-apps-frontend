import React from 'react';
import {
  render,
  screen,
  act,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfigProvider } from '../ConfigProvider';
import { useConfig } from '@hooks/useConfig';
import { getConfig } from '@services/configService';
import notificationService from '@services/notificationService';
import { DASHBOARD_CONFIG_URL } from '@constants/dashboard';
import { AppConfig } from '@types/config';
import dashboardConfigSchema from '@schemas/appConfig.schema.json';

// Mock the configService
jest.mock('@services/configService');
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

// Mock the notificationService
jest.mock('@services/notificationService', () => ({
  __esModule: true,
  default: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  },
}));

// Mock the timer functions
jest.useFakeTimers();

// Valid config that matches the schema
const validConfig: AppConfig = {
  patientInformation: {
    translationKey: 'PATIENT_INFO_KEY',
    type: 'default',
  },
  actions: [],
  dashboards: [
    {
      id: 'dept1',
      name: 'Department 1',
      description: 'First department',
      url: 'http://dept1.config',
      requiredPrivilege: 'DEPT1_ACCESS',
    },
    {
      id: 'dept2',
      name: 'Department 2',
      description: 'Second department',
      url: 'http://dept2.config',
      requiredPrivilege: 'DEPT2_ACCESS',
    },
  ],
};

// Expected config map after processing
const expectedConfigMap = {
  dept1: 'http://dept1.config',
  dept2: 'http://dept2.config',
};

// Test component that uses the useConfig hook
const TestComponent = () => {
  const { config, isLoading, error } = useConfig();
  return (
    <div>
      <div data-testid="config-test">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="config-data">
        {config ? JSON.stringify(config) : 'No config'}
      </div>
      <div data-testid="config-error">{error ? error.message : 'No error'}</div>
    </div>
  );
};

// Test component that uses the context setter functions
const TestComponentWithSetters = () => {
  const { config, setConfig, isLoading, setIsLoading, error, setError } =
    useConfig();

  return (
    <div>
      <div data-testid="config-test">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="config-data">
        {config ? JSON.stringify(config) : 'No config'}
      </div>
      <div data-testid="config-error">{error ? error.message : 'No error'}</div>

      <button
        data-testid="set-config"
        onClick={() => setConfig({ test: 'new-config' })}
      >
        Set Config
      </button>
      <button data-testid="set-loading-true" onClick={() => setIsLoading(true)}>
        Set Loading True
      </button>
      <button
        data-testid="set-loading-false"
        onClick={() => setIsLoading(false)}
      >
        Set Loading False
      </button>
      <button
        data-testid="set-error"
        onClick={() => setError(new Error('Test error'))}
      >
        Set Error
      </button>
      <button data-testid="clear-error" onClick={() => setError(null)}>
        Clear Error
      </button>
    </div>
  );
};

describe('ConfigProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  test('renders children properly', async () => {
    await act(async () => {
      render(
        <ConfigProvider>
          <div data-testid="child-element">Child Element</div>
        </ConfigProvider>,
      );
    });

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });

  test('fetches and sets config on mount', async () => {
    // Mock successful config fetch
    mockGetConfig.mockResolvedValueOnce(validConfig);

    await act(async () => {
      render(
        <ConfigProvider>
          <TestComponent />
        </ConfigProvider>,
      );
    });

    // Initially should be loading
    expect(screen.getByTestId('config-test').textContent).toBe('Loaded');

    // Verify config was fetched and set correctly
    expect(mockGetConfig).toHaveBeenCalledWith(
      DASHBOARD_CONFIG_URL,
      dashboardConfigSchema,
    );
    expect(screen.getByTestId('config-data').textContent).toBe(
      JSON.stringify(expectedConfigMap),
    );
    expect(screen.getByTestId('config-error').textContent).toBe('No error');
  });

  test('handles null config response', async () => {
    // Mock null config response
    mockGetConfig.mockResolvedValueOnce(null);

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });

    // Verify error is set and notification is shown
    expect(screen.getByTestId('config-data').textContent).toBe('No config');
    expect(screen.getByTestId('config-error').textContent).not.toBe('No error');
    expect(notificationService.showError).toHaveBeenCalled();
  });

  test('handles empty dashboards array', async () => {
    // Config with empty dashboards array
    const emptyDashboardsConfig: AppConfig = {
      patientInformation: {
        translationKey: 'PATIENT_INFO_KEY',
        type: 'default',
      },
      actions: [],
      dashboards: [],
    };

    mockGetConfig.mockResolvedValueOnce(emptyDashboardsConfig);

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });

    // Verify error is set and notification is shown
    expect(screen.getByTestId('config-data').textContent).toBe('No config');
    expect(screen.getByTestId('config-error').textContent).not.toBe('No error');
    expect(notificationService.showError).toHaveBeenCalled();
  });

  test('handles network error during config fetch', async () => {
    // Mock network error
    const networkError = new Error('Network error');
    mockGetConfig.mockRejectedValueOnce(networkError);

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });

    // Verify error is set and notification is shown
    expect(screen.getByTestId('config-data').textContent).toBe('No config');
    expect(notificationService.showError).toHaveBeenCalled();
  });

  test('handles invalid config data', async () => {
    // Mock invalid config response
    const invalidConfig = {
      patientInformation: {
        translationKey: 'PATIENT_INFO_KEY',
        type: 'default',
      },
      actions: [],
      // Missing dashboards array
    } as unknown as AppConfig;

    mockGetConfig.mockResolvedValueOnce(invalidConfig);

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });

    // Verify error is set and notification is shown
    expect(screen.getByTestId('config-data').textContent).toBe('No config');
    expect(notificationService.showError).toHaveBeenCalled();
  });

  test('updates loading state correctly', async () => {
    // Mock delayed config response
    mockGetConfig.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(validConfig), 100);
        }),
    );

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Initially should be loading
    expect(screen.getByTestId('config-test').textContent).toBe('Loading');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });
  });

  test('handles error state correctly', async () => {
    // Mock error during config fetch
    const testError = new Error('Test error message');
    mockGetConfig.mockRejectedValueOnce(testError);

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });

    // Verify error is set
    expect(screen.getByTestId('config-error').textContent).not.toBe('No error');
    expect(notificationService.showError).toHaveBeenCalled();
  });

  test('multiple components share the same config context', async () => {
    // Mock successful config fetch
    mockGetConfig.mockResolvedValueOnce(validConfig);

    const AnotherTestComponent = () => {
      const { config } = useConfig();
      return (
        <div data-testid="another-component">
          {config ? JSON.stringify(config) : 'No config'}
        </div>
      );
    };

    render(
      <ConfigProvider>
        <TestComponent />
        <AnotherTestComponent />
      </ConfigProvider>,
    );

    // Wait for config to load
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });

    // Verify both components have the same config
    expect(screen.getByTestId('config-data').textContent).toBe(
      screen.getByTestId('another-component').textContent,
    );
  });

  test('throws error when useConfig is used outside provider', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Expect rendering to throw an error
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useConfig must be used within a ConfigProvider');

    // Restore console.error
    console.error = originalConsoleError;
  });

  test('setConfig updates the config state', async () => {
    // Mock successful config fetch
    mockGetConfig.mockResolvedValueOnce(validConfig);

    render(
      <ConfigProvider>
        <TestComponentWithSetters />
      </ConfigProvider>,
    );

    // Wait for config to load
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });

    // Initial config
    expect(screen.getByTestId('config-data').textContent).toBe(
      JSON.stringify(expectedConfigMap),
    );

    // Update config
    fireEvent.click(screen.getByTestId('set-config'));

    // Verify config was updated
    expect(screen.getByTestId('config-data').textContent).toBe(
      JSON.stringify({ test: 'new-config' }),
    );
  });

  test('setIsLoading updates the loading state', async () => {
    // Mock successful config fetch
    mockGetConfig.mockResolvedValueOnce(validConfig);

    render(
      <ConfigProvider>
        <TestComponentWithSetters />
      </ConfigProvider>,
    );

    // Wait for config to load
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });

    // Set loading to true
    fireEvent.click(screen.getByTestId('set-loading-true'));

    // Verify loading state was updated
    expect(screen.getByTestId('config-test').textContent).toBe('Loading');

    // Set loading to false
    fireEvent.click(screen.getByTestId('set-loading-false'));

    // Verify loading state was updated
    expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
  });

  test('setError updates the error state', async () => {
    // Mock successful config fetch
    mockGetConfig.mockResolvedValueOnce(validConfig);

    render(
      <ConfigProvider>
        <TestComponentWithSetters />
      </ConfigProvider>,
    );

    // Wait for config to load
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });

    // Initial error state
    expect(screen.getByTestId('config-error').textContent).toBe('No error');

    // Set error
    fireEvent.click(screen.getByTestId('set-error'));

    // Verify error state was updated
    expect(screen.getByTestId('config-error').textContent).toBe('Test error');

    // Clear error
    fireEvent.click(screen.getByTestId('clear-error'));

    // Verify error state was cleared
    expect(screen.getByTestId('config-error').textContent).toBe('No error');
  });

  test('correctly maps dashboard config to configMap', async () => {
    // Config with multiple dashboards
    const multiDashboardConfig: AppConfig = {
      patientInformation: {
        translationKey: 'PATIENT_INFO_KEY',
        type: 'default',
      },
      actions: [],
      dashboards: [
        {
          id: 'dept1',
          name: 'Department 1',
          description: 'First department',
          url: 'http://dept1.config',
          requiredPrivilege: 'DEPT1_ACCESS',
        },
        {
          id: 'dept2',
          name: 'Department 2',
          description: 'Second department',
          url: 'http://dept2.config',
          requiredPrivilege: 'DEPT2_ACCESS',
        },
        {
          id: 'dept3',
          name: 'Department 3',
          description: 'Third department',
          url: 'http://dept3.config',
          requiredPrivilege: 'DEPT3_ACCESS',
        },
      ],
    };

    const expectedMultiConfigMap = {
      dept1: 'http://dept1.config',
      dept2: 'http://dept2.config',
      dept3: 'http://dept3.config',
    };

    // Mock successful config fetch
    mockGetConfig.mockResolvedValueOnce(multiDashboardConfig);

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Wait for config to load
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });

    // Verify config was fetched and set correctly
    expect(screen.getByTestId('config-data').textContent).toBe(
      JSON.stringify(expectedMultiConfigMap),
    );
  });

  test('handles invalid dashboard data correctly', async () => {
    // Config with invalid dashboard data (missing required fields)
    const invalidDashboardConfig = {
      patientInformation: {
        translationKey: 'PATIENT_INFO_KEY',
        type: 'default',
      },
      actions: [],
      dashboards: null,
    } as unknown as AppConfig;

    // Mock successful config fetch but with invalid data
    mockGetConfig.mockResolvedValueOnce(invalidDashboardConfig);

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
    });

    // Verify error is set and notification is shown
    expect(screen.getByTestId('config-data').textContent).toBe('No config');
    expect(screen.getByTestId('config-error').textContent).not.toBe('No error');
    expect(notificationService.showError).toHaveBeenCalled();
  });
});
