import {
  getOrdersConfig,
  getOrdersTableConfig,
  notificationService,
  OrdersConfig,
  OrdersTableConfig,
} from '@bahmni/services';
import {
  render,
  screen,
  act,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import * as configMocks from '../../__mocks__/configMocks';
import { useOrdersConfig } from '../../hooks/useOrdersConfig';
import { OrdersConfigProvider } from '../OrdersConfigProvider';

// Mock the notificationService
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getOrdersConfig: jest.fn(),
  getOrdersTableConfig: jest.fn(),
  notificationService: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  },
  __esModule: true,
}));

const mockGetConfig = getOrdersConfig as jest.MockedFunction<
  typeof getOrdersConfig
>;
const mockGetTableConfig = getOrdersTableConfig as jest.MockedFunction<
  typeof getOrdersTableConfig
>;

// Mock the timer functions
jest.useFakeTimers();

// Test component that uses the useOrdersConfig hook
const TestComponent = () => {
  const {
    ordersConfig,
    tabs,
    defaultColumnConfigs,
    drugOrderColumnConfigs,
    isLoading,
    error,
  } = useOrdersConfig();
  return (
    <div>
      <div data-testid="config-test">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="config-data">
        {ordersConfig ? JSON.stringify(ordersConfig) : 'No config'}
      </div>
      <div data-testid="tabs-data">
        {tabs.length > 0 ? JSON.stringify(tabs) : 'No tabs'}
      </div>
      <div data-testid="default-column-configs">
        {defaultColumnConfigs.length > 0
          ? JSON.stringify(defaultColumnConfigs)
          : 'No default configs'}
      </div>
      <div data-testid="drug-order-column-configs">
        {drugOrderColumnConfigs.length > 0
          ? JSON.stringify(drugOrderColumnConfigs)
          : 'No drug configs'}
      </div>
      <div data-testid="config-error">{error ? error.message : 'No error'}</div>
    </div>
  );
};

// Test component that uses the context setter functions
const TestComponentWithSetters = () => {
  const {
    ordersConfig,
    setOrdersConfig,
    tabs,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = useOrdersConfig();

  return (
    <div>
      <div data-testid="config-test">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="config-data">
        {ordersConfig ? JSON.stringify(ordersConfig) : 'No config'}
      </div>
      <div data-testid="tabs-data">
        {tabs.length > 0 ? JSON.stringify(tabs) : 'No tabs'}
      </div>
      <div data-testid="config-error">{error ? error.message : 'No error'}</div>

      <button
        data-testid="set-config"
        onClick={() =>
          setOrdersConfig(configMocks.minimalOrdersConfig as OrdersConfig)
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

describe('OrdersConfigProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Configuration Loading Tests', () => {
    test('should load and provide configuration successfully', async () => {
      const mockTableConfig: OrdersTableConfig = {
        ordersTableColumnHeaders: [
          {
            key: 'badge',
            header: '',
            translationKey: '',
            visible: true,
            sortable: false,
          },
          {
            key: 'patientName',
            header: 'Patient Name',
            translationKey: 'PATIENT_NAME',
            visible: true,
            sortable: true,
          },
          {
            key: 'identifier',
            header: 'Identifier',
            translationKey: 'IDENTIFIER',
            visible: true,
            sortable: true,
          },
        ],
        drugTabsColumnHeaders: [
          {
            key: 'patientName',
            header: 'Patient Name',
            translationKey: 'PATIENT_NAME',
            visible: true,
            sortable: true,
          },
          {
            key: 'identifier',
            header: 'Identifier',
            translationKey: 'IDENTIFIER',
            visible: true,
            sortable: true,
          },
        ],
      };

      mockGetConfig.mockResolvedValueOnce(
        configMocks.validFullOrdersConfig as OrdersConfig,
      );
      mockGetTableConfig.mockResolvedValueOnce(mockTableConfig);

      render(
        <OrdersConfigProvider>
          <TestComponent />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.validFullOrdersConfig),
      );
      expect(screen.getByTestId('config-error').textContent).toBe('No error');
      expect(screen.getByTestId('tabs-data').textContent).not.toBe('No tabs');
      expect(screen.getByTestId('default-column-configs').textContent).toBe(
        JSON.stringify(mockTableConfig.ordersTableColumnHeaders),
      );
      expect(screen.getByTestId('drug-order-column-configs').textContent).toBe(
        JSON.stringify(mockTableConfig.drugTabsColumnHeaders),
      );
    });

    test('should handle minimal configuration', async () => {
      mockGetConfig.mockResolvedValueOnce(
        configMocks.minimalOrdersConfig as OrdersConfig,
      );
      mockGetTableConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <TestComponent />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalOrdersConfig),
      );
      expect(screen.getByTestId('config-error').textContent).toBe('No error');
      expect(screen.getByTestId('default-column-configs').textContent).toBe(
        'No default configs',
      );
      expect(screen.getByTestId('drug-order-column-configs').textContent).toBe(
        'No drug configs',
      );
    });

    test('should handle empty configuration', async () => {
      mockGetConfig.mockResolvedValueOnce(
        configMocks.emptyOrdersConfig as OrdersConfig,
      );
      mockGetTableConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <TestComponent />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.emptyOrdersConfig),
      );
      expect(screen.getByTestId('tabs-data').textContent).toBe('No tabs');
      expect(screen.getByTestId('config-error').textContent).toBe('No error');
    });

    test('should handle null configuration', async () => {
      mockGetConfig.mockResolvedValueOnce(null);
      mockGetTableConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <TestComponent />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      expect(screen.getByTestId('config-data').textContent).toBe('No config');
      expect(screen.getByTestId('tabs-data').textContent).toBe('No tabs');
      expect(screen.getByTestId('config-error').textContent).toBe('No error');
    });

    test('should sort tabs by order property', async () => {
      mockGetConfig.mockResolvedValueOnce(
        configMocks.unsortedOrdersConfig as OrdersConfig,
      );
      mockGetTableConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <TestComponent />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      const tabs = JSON.parse(screen.getByTestId('tabs-data').textContent);
      expect(tabs[0].order).toBe(1); // Radiology should be first
      expect(tabs[1].order).toBe(2); // Lab should be second
      expect(tabs[2].order).toBe(5); // Rehab should be last
    });
  });

  describe('State Management Tests', () => {
    test('should handle concurrent state updates', async () => {
      mockGetConfig.mockResolvedValueOnce(
        configMocks.validFullOrdersConfig as OrdersConfig,
      );
      mockGetTableConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <TestComponentWithSetters />
        </OrdersConfigProvider>,
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
        JSON.stringify(configMocks.minimalOrdersConfig),
      );
    });

    test('should handle rapid sequential updates to config', async () => {
      mockGetConfig.mockResolvedValueOnce(
        configMocks.validFullOrdersConfig as OrdersConfig,
      );
      mockGetTableConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <TestComponentWithSetters />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      // Initial config
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.validFullOrdersConfig),
      );

      // Rapid sequential updates
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId('set-config'));
      }

      // Verify final update was applied
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalOrdersConfig),
      );
    });

    test('should maintain state persistence across re-renders', async () => {
      mockGetConfig.mockResolvedValueOnce(
        configMocks.validFullOrdersConfig as OrdersConfig,
      );
      mockGetTableConfig.mockResolvedValueOnce(null);

      const { rerender } = render(
        <OrdersConfigProvider>
          <TestComponentWithSetters />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      });

      // Update config
      fireEvent.click(screen.getByTestId('set-config'));
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalOrdersConfig),
      );

      // Re-render with different children
      rerender(
        <OrdersConfigProvider>
          <div>Different child</div>
          <TestComponentWithSetters />
        </OrdersConfigProvider>,
      );

      // Verify state persists
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalOrdersConfig),
      );
    });

    test('should handle state updates during loading', async () => {
      // Mock delayed config response
      mockGetConfig.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => resolve(configMocks.validFullOrdersConfig as OrdersConfig),
              1000,
            );
          }),
      );
      mockGetTableConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <TestComponentWithSetters />
        </OrdersConfigProvider>,
      );

      // Initially should be loading
      expect(screen.getByTestId('config-test').textContent).toBe('Loading');

      // Update state during loading
      fireEvent.click(screen.getByTestId('set-config'));
      fireEvent.click(screen.getByTestId('set-loading-false'));

      // Verify updates were applied
      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalOrdersConfig),
      );

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Verify config from API doesn't override manual updates
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalOrdersConfig),
      );
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle configuration fetch error', async () => {
      const error = new Error('Failed to fetch configuration');
      mockGetConfig.mockRejectedValueOnce(error);
      mockGetTableConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <TestComponent />
        </OrdersConfigProvider>,
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

    test('should handle malformed JSON response', async () => {
      const jsonError = new SyntaxError('Unexpected token in JSON');
      mockGetConfig.mockRejectedValueOnce(jsonError);
      mockGetTableConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <TestComponent />
        </OrdersConfigProvider>,
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

    test('should handle network error', async () => {
      const networkError = new Error('Network request failed');
      mockGetConfig.mockRejectedValueOnce(networkError);
      mockGetTableConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <TestComponent />
        </OrdersConfigProvider>,
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
