import {
  render,
  screen,
  act,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import * as configMocks from '../../__mocks__/configMocks';
import { useClinicalConfig } from '../../hooks/useClinicalConfig';
import { getClinicalConfig } from '@bahmni-frontend/bahmni-services';
import { notificationService } from '@bahmni-frontend/bahmni-services';
import { ClinicalConfig } from '@bahmni-frontend/bahmni-services';
import { ClinicalConfigProvider } from '../ClinicalConfigProvider';



// Mock the notificationService
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  getClinicalConfig: jest.fn(),
  notificationService: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  },
  __esModule: true,
}));

const mockGetConfig = getClinicalConfig as jest.MockedFunction<
  typeof getClinicalConfig
>;
// Mock the timer functions
jest.useFakeTimers();

// Additional test mocks
const multipleDefaultsConfig: ClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [
    {
      name: 'Dashboard 1',
      requiredPrivileges: [],
      url: 'dash1.json',
      default: true,
    },
    {
      name: 'Dashboard 2',
      requiredPrivileges: [],
      url: 'dash2.json',
      default: true,
    },
  ],
};

const noDefaultDashboardConfig: ClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [
    {
      name: 'Dashboard 1',
      requiredPrivileges: [],
      url: 'dash1.json',
      default: false,
    },
    {
      name: 'Dashboard 2',
      requiredPrivileges: [],
      url: 'dash2.json',
      default: false,
    },
  ],
};

const emptyRequiredPrivilegesConfig: ClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [
    {
      name: 'Dashboard 1',
      requiredPrivileges: [],
      url: 'dash1.json',
    },
  ],
};

const specialCharactersConfig: ClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [
    {
      name: 'Dashboard with special chars: !@#$%^&*()',
      requiredPrivileges: ['view:special'],
      url: 'http://example.com/dash?param=value&special=true',
    },
  ],
};

const longValuesConfig: ClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [
    {
      name: 'A'.repeat(500), // Very long name
      requiredPrivileges: ['view'],
      url: 'http://example.com/'.concat('a'.repeat(1000)), // Very long URL
    },
  ],
};

// Test component that uses the useClinicalConfig hook
const TestComponent = () => {
  const { clinicalConfig, isLoading, error } = useClinicalConfig();
  return (
    <div>
      <div data-testid="config-test">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="config-data">
        {clinicalConfig ? JSON.stringify(clinicalConfig) : 'No config'}
      </div>
      <div data-testid="config-error">{error ? error.message : 'No error'}</div>
    </div>
  );
};

// Test component that uses the context setter functions
const TestComponentWithSetters = () => {
  const {
    clinicalConfig,
    setClinicalConfig,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = useClinicalConfig();

  return (
    <div>
      <div data-testid="config-test">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="config-data">
        {clinicalConfig ? JSON.stringify(clinicalConfig) : 'No config'}
      </div>
      <div data-testid="config-error">{error ? error.message : 'No error'}</div>

      <button
        data-testid="set-config"
        onClick={() =>
          setClinicalConfig(configMocks.minimalClinicalConfig as ClinicalConfig)
        }
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

describe('ClinicalConfigProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Dashboard Configuration Tests', () => {
    test('should handle multiple default dashboards', async () => {
      mockGetConfig.mockResolvedValueOnce(multipleDefaultsConfig);

      render(
        <ClinicalConfigProvider>
          <TestComponent />
        </ClinicalConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      // Multiple defaults are valid according to the schema
      expect(screen.getByTestId('config-data').textContent).not.toBe(
        'No config',
      );
      expect(screen.getByTestId('config-error').textContent).toBe('No error');
    });

    test('should handle no default dashboard', async () => {
      mockGetConfig.mockResolvedValueOnce(noDefaultDashboardConfig);

      render(
        <ClinicalConfigProvider>
          <TestComponent />
        </ClinicalConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      // No default is valid according to the schema
      expect(screen.getByTestId('config-data').textContent).not.toBe(
        'No config',
      );
      expect(screen.getByTestId('config-error').textContent).toBe('No error');
    });

    test('should handle empty requiredPrivileges array', async () => {
      mockGetConfig.mockResolvedValueOnce(emptyRequiredPrivilegesConfig);

      render(
        <ClinicalConfigProvider>
          <TestComponent />
        </ClinicalConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      // Empty requiredPrivileges array is valid
      expect(screen.getByTestId('config-data').textContent).not.toBe(
        'No config',
      );
      expect(screen.getByTestId('config-error').textContent).toBe('No error');
    });

    test('should handle special characters in dashboard names and URLs', async () => {
      mockGetConfig.mockResolvedValueOnce(specialCharactersConfig);

      render(
        <ClinicalConfigProvider>
          <TestComponent />
        </ClinicalConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      // Special characters are valid
      expect(screen.getByTestId('config-data').textContent).not.toBe(
        'No config',
      );
      expect(screen.getByTestId('config-error').textContent).toBe('No error');
    });

    test('should handle very long dashboard names/URLs', async () => {
      mockGetConfig.mockResolvedValueOnce(longValuesConfig);

      render(
        <ClinicalConfigProvider>
          <TestComponent />
        </ClinicalConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      // Long values are valid
      expect(screen.getByTestId('config-data').textContent).not.toBe(
        'No config',
      );
      expect(screen.getByTestId('config-error').textContent).toBe('No error');
    });
  });

  describe('State Management Tests', () => {
    test('should handle concurrent state updates', async () => {
      mockGetConfig.mockResolvedValueOnce(
        configMocks.validFullClinicalConfig as ClinicalConfig,
      );

      render(
        <ClinicalConfigProvider>
          <TestComponentWithSetters />
        </ClinicalConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      // Simulate concurrent updates
      fireEvent.click(screen.getByTestId('set-loading-true'));
      fireEvent.click(screen.getByTestId('set-error'));
      fireEvent.click(screen.getByTestId('set-config'));

      // Verify all updates were applied
      expect(screen.getByTestId('config-test').textContent).toBe('Loading');
      expect(screen.getByTestId('config-error').textContent).toBe('Test error');
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalClinicalConfig),
      );
    });

    test('should handle rapid sequential updates to config', async () => {
      mockGetConfig.mockResolvedValueOnce(
        configMocks.validFullClinicalConfig as ClinicalConfig,
      );

      render(
        <ClinicalConfigProvider>
          <TestComponentWithSetters />
        </ClinicalConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      // Initial config
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.validFullClinicalConfig),
      );

      // Rapid sequential updates
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId('set-config'));
      }

      // Verify final update was applied
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalClinicalConfig),
      );
    });

    test('should maintain state persistence across re-renders', async () => {
      mockGetConfig.mockResolvedValueOnce(
        configMocks.validFullClinicalConfig as ClinicalConfig,
      );

      const { rerender } = render(
        <ClinicalConfigProvider>
          <TestComponentWithSetters />
        </ClinicalConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      // Update config
      fireEvent.click(screen.getByTestId('set-config'));
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalClinicalConfig),
      );

      // Re-render with different children
      rerender(
        <ClinicalConfigProvider>
          <div>Different child</div>
          <TestComponentWithSetters />
        </ClinicalConfigProvider>,
      );

      // Verify state persists
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalClinicalConfig),
      );
    });

    test('should handle state updates during loading', async () => {
      // Mock delayed config response
      mockGetConfig.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve(configMocks.validFullClinicalConfig as ClinicalConfig),
              1000,
            );
          }),
      );

      render(
        <ClinicalConfigProvider>
          <TestComponentWithSetters />
        </ClinicalConfigProvider>,
      );

      // Initially should be loading
      expect(screen.getByTestId('config-test').textContent).toBe('Loading');

      // Update state during loading
      fireEvent.click(screen.getByTestId('set-config'));
      fireEvent.click(screen.getByTestId('set-loading-false'));

      // Verify updates were applied
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalClinicalConfig),
      );

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Verify config from API doesn't override manual updates
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalClinicalConfig),
      );
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle malformed JSON response', async () => {
      // Mock error for malformed JSON
      const jsonError = new SyntaxError('Unexpected token in JSON');
      mockGetConfig.mockRejectedValueOnce(jsonError);

      render(
        <ClinicalConfigProvider>
          <TestComponent />
        </ClinicalConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      expect(screen.getByTestId('config-data').textContent).toBe('No config');
      expect(screen.getByTestId('config-error').textContent).not.toBe(
        'No error',
      );
      expect(notificationService.showError).toHaveBeenCalled();
    });
  });
});
