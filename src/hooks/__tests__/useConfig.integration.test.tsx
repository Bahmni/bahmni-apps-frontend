import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { ConfigProvider } from '@providers/ConfigProvider';
import { useConfig } from '../useConfig';
import { DASHBOARD_CONFIG_URL } from '@constants/dashboard';
import { getConfig } from '@services/configService';
import { AppConfig } from '@types/config';
import notificationService from '@services/notificationService';

// Mock the configService and notificationService
jest.mock('@services/configService');
jest.mock('@services/notificationService', () => ({
  showError: jest.fn(),
}));

describe('useConfig Integration', () => {
  // Mock AppConfig matching the schema
  const mockAppConfig: AppConfig = {
    patientInformation: {
      translationKey: 'PATIENT_INFO',
      type: 'info',
    },
    actions: [],
    dashboards: [
      {
        id: 'dept1',
        name: 'Department 1',
        description: 'First Department',
        url: 'http://example.com/dept1',
        requiredPrivilege: 'VIEW_DEPT1',
      },
      {
        id: 'dept2',
        name: 'Department 2',
        description: 'Second Department',
        url: 'http://example.com/dept2',
        requiredPrivilege: 'VIEW_DEPT2',
      },
    ],
  };

  // Expected transformed config (department ID to URL mapping)
  const expectedTransformedConfig = {
    dept1: 'http://example.com/dept1',
    dept2: 'http://example.com/dept2',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch config and transform it to department ID to URL mapping', async () => {
    // Mock the getConfig function to return the mock AppConfig
    (getConfig as jest.Mock).mockResolvedValueOnce(mockAppConfig);

    const TestComponent = () => {
      const { config, isLoading } = useConfig();
      return (
        <div data-testid="test-component">
          {isLoading ? 'Loading...' : JSON.stringify(config)}
        </div>
      );
    };

    const { getByTestId } = render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Initially it should be loading
    expect(getByTestId('test-component').textContent).toBe('Loading...');

    // Wait for the config to be loaded
    await waitFor(() => {
      expect(getByTestId('test-component').textContent).not.toBe('Loading...');
    });

    // Verify the config was fetched and transformed correctly
    expect(getConfig).toHaveBeenCalledWith(
      DASHBOARD_CONFIG_URL,
      expect.any(Object), // Schema validation
    );

    // Check that the config was transformed to department ID to URL mapping
    expect(getByTestId('test-component').textContent).toBe(
      JSON.stringify(expectedTransformedConfig),
    );
  });

  it('should share transformed config state between components using the same context', async () => {
    (getConfig as jest.Mock).mockResolvedValueOnce(mockAppConfig);

    const TestComponent1 = () => {
      const { config } = useConfig();
      return <div data-testid="component-1">{JSON.stringify(config)}</div>;
    };

    const TestComponent2 = () => {
      const { config } = useConfig();
      return <div data-testid="component-2">{JSON.stringify(config)}</div>;
    };

    const { getByTestId } = render(
      <ConfigProvider>
        <TestComponent1 />
        <TestComponent2 />
      </ConfigProvider>,
    );

    // Wait for the config to be loaded
    await waitFor(() => {
      expect(getByTestId('component-1').textContent).toBe(
        JSON.stringify(expectedTransformedConfig),
      );
    });

    // Verify both components have the same config
    expect(getByTestId('component-1').textContent).toBe(
      getByTestId('component-2').textContent,
    );
  });

  it('should handle loading states correctly', async () => {
    // Mock a delayed response
    (getConfig as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockAppConfig), 100)),
    );

    const TestComponent = () => {
      const { isLoading } = useConfig();
      return (
        <div data-testid="loading-state">
          {isLoading ? 'Loading' : 'Loaded'}
        </div>
      );
    };

    const { getByTestId } = render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Initially it should be loading
    expect(getByTestId('loading-state').textContent).toBe('Loading');

    // After the config is loaded, it should not be loading
    await waitFor(() => {
      expect(getByTestId('loading-state').textContent).toBe('Loaded');
    });
  });

  it('should handle error states and show notification', async () => {
    // Mock an error response
    const mockError = new Error('Failed to fetch config');
    (getConfig as jest.Mock).mockRejectedValueOnce(mockError);

    const TestComponent = () => {
      const { error, config } = useConfig();
      return (
        <div data-testid="error-state">
          {error ? 'Error' : 'No Error'} | Config: {JSON.stringify(config)}
        </div>
      );
    };

    const { getByTestId } = render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Wait for the error to be processed
    await waitFor(() => {
      expect(getByTestId('error-state').textContent).toContain('Error');
      expect(getByTestId('error-state').textContent).toContain('Config: null');
    });

    // Verify notification service was called
    expect(notificationService.showError).toHaveBeenCalled();
  });

  it('should handle empty dashboards array', async () => {
    // Mock config with empty dashboards array
    const emptyDashboardsConfig: AppConfig = {
      patientInformation: {
        translationKey: 'PATIENT_INFO',
        type: 'info',
      },
      actions: [],
      dashboards: [],
    };

    (getConfig as jest.Mock).mockResolvedValueOnce(emptyDashboardsConfig);

    const TestComponent = () => {
      const { config, error } = useConfig();
      return (
        <div data-testid="empty-dashboards">
          Config: {JSON.stringify(config)} | Error: {error ? 'Yes' : 'No'}
        </div>
      );
    };

    const { getByTestId } = render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Should show error and null config
    await waitFor(() => {
      expect(getByTestId('empty-dashboards').textContent).toContain(
        'Config: null',
      );
      expect(getByTestId('empty-dashboards').textContent).toContain(
        'Error: Yes',
      );
    });

    // Verify notification service was called
    expect(notificationService.showError).toHaveBeenCalled();
  });
});
