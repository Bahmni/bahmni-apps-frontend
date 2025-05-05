import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardConfigProvider } from '../DashboardConfigProvider';
import { useDashboardConfig } from '@hooks/useDashboardConfig';
import { getDashboardConfig } from '@services/configService';
import notificationService from '@services/notificationService';
import { DashboardConfig } from '@types/dashboardConfig';

// Mock the configService
jest.mock('@services/configService');
const mockGetDashboardConfig = getDashboardConfig as jest.MockedFunction<
  typeof getDashboardConfig
>;

// Mock the notificationService
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

// Mock the getFormattedError utility
jest.mock('@utils/common', () => ({
  getFormattedError: jest.fn().mockImplementation((error) => ({
    title: 'Error',
    message: error instanceof Error ? error.message : 'Unknown error',
  })),
}));

// Mock dashboard config data
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

// Empty dashboard config
const emptyDashboardConfig: DashboardConfig = {
  sections: [],
};

// Large dashboard config
const largeDashboardConfig: DashboardConfig = {
  sections: Array(20)
    .fill(0)
    .map((_, i) => ({
      name: `Section ${i}`,
      icon: `icon-${i}`,
      controls: [],
    })),
};

// Test component that uses the useDashboardConfig hook
const TestComponent = () => {
  const { dashboardConfig, isLoading, error } = useDashboardConfig();

  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="config-data">
        {dashboardConfig ? JSON.stringify(dashboardConfig) : 'No config'}
      </div>
      <div data-testid="error-state">{error ? error.message : 'No error'}</div>
    </div>
  );
};

describe('DashboardConfigProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders children properly', () => {
    render(
      <DashboardConfigProvider dashboardURL="test-dashboard">
        <div data-testid="child-element">Child Element</div>
      </DashboardConfigProvider>,
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });

  test('initializes with correct default states', () => {
    // Mock the getDashboardConfig to delay response
    mockGetDashboardConfig.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockDashboardConfig), 100),
        ),
    );

    render(
      <DashboardConfigProvider dashboardURL="test-dashboard">
        <TestComponent />
      </DashboardConfigProvider>,
    );

    // Initially should be in loading state
    expect(screen.getByTestId('loading-state').textContent).toBe('Loading');
    expect(screen.getByTestId('config-data').textContent).toBe('No config');
    expect(screen.getByTestId('error-state').textContent).toBe('No error');
  });

  test('loads dashboard config successfully', async () => {
    // Arrange
    mockGetDashboardConfig.mockResolvedValueOnce(mockDashboardConfig);

    // Act
    render(
      <DashboardConfigProvider dashboardURL="test-dashboard">
        <TestComponent />
      </DashboardConfigProvider>,
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded');
    });

    expect(mockGetDashboardConfig).toHaveBeenCalledWith('test-dashboard');
    expect(screen.getByTestId('config-data').textContent).toBe(
      JSON.stringify(mockDashboardConfig),
    );
    expect(screen.getByTestId('error-state').textContent).toBe('No error');
  });

  test('handles API request failure', async () => {
    // Arrange
    const networkError = new Error('Network error');
    mockGetDashboardConfig.mockRejectedValueOnce(networkError);

    // Act
    render(
      <DashboardConfigProvider dashboardURL="test-dashboard">
        <TestComponent />
      </DashboardConfigProvider>,
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded');
    });

    expect(mockGetDashboardConfig).toHaveBeenCalledWith('test-dashboard');
    expect(screen.getByTestId('config-data').textContent).toBe('No config');
    expect(screen.getByTestId('error-state').textContent).toBe('Network error');
    expect(notificationService.showError).toHaveBeenCalled();
  });

  test('handles empty response from API', async () => {
    // Arrange
    mockGetDashboardConfig.mockResolvedValueOnce(null);

    // Act
    render(
      <DashboardConfigProvider dashboardURL="test-dashboard">
        <TestComponent />
      </DashboardConfigProvider>,
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded');
    });

    expect(mockGetDashboardConfig).toHaveBeenCalledWith('test-dashboard');
    expect(screen.getByTestId('config-data').textContent).toBe('No config');
    expect(screen.getByTestId('error-state').textContent).toBe('No error');
  });

  test('handles empty dashboard configuration', async () => {
    // Arrange
    mockGetDashboardConfig.mockResolvedValueOnce(emptyDashboardConfig);

    // Act
    render(
      <DashboardConfigProvider dashboardURL="test-dashboard">
        <TestComponent />
      </DashboardConfigProvider>,
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded');
    });

    expect(mockGetDashboardConfig).toHaveBeenCalledWith('test-dashboard');
    expect(screen.getByTestId('config-data').textContent).toBe(
      JSON.stringify(emptyDashboardConfig),
    );
    expect(screen.getByTestId('error-state').textContent).toBe('No error');
  });

  test('handles large dashboard configuration', async () => {
    // Arrange
    mockGetDashboardConfig.mockResolvedValueOnce(largeDashboardConfig);

    // Act
    render(
      <DashboardConfigProvider dashboardURL="test-dashboard">
        <TestComponent />
      </DashboardConfigProvider>,
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded');
    });

    expect(mockGetDashboardConfig).toHaveBeenCalledWith('test-dashboard');
    expect(screen.getByTestId('config-data').textContent).toBe(
      JSON.stringify(largeDashboardConfig),
    );
    expect(screen.getByTestId('error-state').textContent).toBe('No error');
  });

  test('handles different dashboard URL values', async () => {
    // Arrange
    const customURL = 'custom-dashboard-url';
    mockGetDashboardConfig.mockResolvedValueOnce(mockDashboardConfig);

    // Act
    render(
      <DashboardConfigProvider dashboardURL={customURL}>
        <TestComponent />
      </DashboardConfigProvider>,
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded');
    });

    expect(mockGetDashboardConfig).toHaveBeenCalledWith(customURL);
    expect(screen.getByTestId('config-data').textContent).toBe(
      JSON.stringify(mockDashboardConfig),
    );
  });

  test('handles malformed JSON response', async () => {
    // Arrange
    const jsonError = new SyntaxError('Unexpected token in JSON');
    mockGetDashboardConfig.mockRejectedValueOnce(jsonError);

    // Act
    render(
      <DashboardConfigProvider dashboardURL="test-dashboard">
        <TestComponent />
      </DashboardConfigProvider>,
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded');
    });

    expect(mockGetDashboardConfig).toHaveBeenCalledWith('test-dashboard');
    expect(screen.getByTestId('config-data').textContent).toBe('No config');
    expect(screen.getByTestId('error-state').textContent).toBe(
      'Unexpected token in JSON',
    );
    expect(notificationService.showError).toHaveBeenCalled();
  });

  test('sets loading state to false after fetch completes with error', async () => {
    // Arrange
    const networkError = new Error('Network error');
    mockGetDashboardConfig.mockRejectedValueOnce(networkError);

    // Act
    render(
      <DashboardConfigProvider dashboardURL="test-dashboard">
        <TestComponent />
      </DashboardConfigProvider>,
    );

    // Initially should be in loading state
    expect(screen.getByTestId('loading-state').textContent).toBe('Loading');

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded');
    });

    expect(mockGetDashboardConfig).toHaveBeenCalledWith('test-dashboard');
  });

  test('updates context value correctly after loading', async () => {
    // Arrange
    mockGetDashboardConfig.mockResolvedValueOnce(mockDashboardConfig);

    // Act
    render(
      <DashboardConfigProvider dashboardURL="test-dashboard">
        <TestComponent />
      </DashboardConfigProvider>,
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded');
    });

    expect(screen.getByTestId('config-data').textContent).toBe(
      JSON.stringify(mockDashboardConfig),
    );
    expect(screen.getByTestId('error-state').textContent).toBe('No error');
  });
});
