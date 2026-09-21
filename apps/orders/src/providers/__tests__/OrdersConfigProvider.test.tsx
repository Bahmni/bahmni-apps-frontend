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

jest.useFakeTimers();

const TestComponent = () => {
  const {
    ordersConfig,
    tabs,
    ordersTableColumnHeadersGeneric,
    ordersTableColumnHeadersCustom,
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
      <div data-testid="orders-table-column-headers-Generic">
        {ordersTableColumnHeadersGeneric.length > 0
          ? JSON.stringify(ordersTableColumnHeadersGeneric)
          : 'No default configs'}
      </div>
      <div data-testid="orders-table-column-headers-Custom">
        {ordersTableColumnHeadersCustom.length > 0
          ? JSON.stringify(ordersTableColumnHeadersCustom)
          : 'No drug configs'}
      </div>
      <div data-testid="config-error">{error ? error.message : 'No error'}</div>
    </div>
  );
};

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
        ordersTableColumnHeadersGeneric: [
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
        ordersTableColumnHeadersCustom: [
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
      // Component adds hasBeenAdmittedConfig to the columns
      const expectedGenericHeaders = [
        ...mockTableConfig.ordersTableColumnHeadersGeneric,
        {
          key: 'hasBeenAdmitted',
          header: '',
          translationKey: '',
          visible: true,
          sortable: false,
        },
      ];
      expect(
        screen.getByTestId('orders-table-column-headers-Generic').textContent,
      ).toBe(JSON.stringify(expectedGenericHeaders));
      // Component adds hasBeenAdmittedConfig to the columns
      const expectedCustomHeaders = [
        ...mockTableConfig.ordersTableColumnHeadersCustom,
        {
          key: 'hasBeenAdmitted',
          header: '',
          translationKey: '',
          visible: true,
          sortable: false,
        },
      ];
      expect(
        screen.getByTestId('orders-table-column-headers-Custom').textContent,
      ).toBe(JSON.stringify(expectedCustomHeaders));
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
      expect(
        screen.getByTestId('orders-table-column-headers-Generic').textContent,
      ).toBe('No default configs');
      expect(
        screen.getByTestId('orders-table-column-headers-Custom').textContent,
      ).toBe('No drug configs');
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
      expect(tabs[0].order).toBe(1);
      expect(tabs[1].order).toBe(2);
      expect(tabs[2].order).toBe(5);
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

      fireEvent.click(screen.getByTestId('set-loading-true'));
      fireEvent.click(screen.getByTestId('set-error'));
      fireEvent.click(screen.getByTestId('set-config'));

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

      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.validFullOrdersConfig),
      );

      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId('set-config'));
      }

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

      fireEvent.click(screen.getByTestId('set-config'));
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalOrdersConfig),
      );

      rerender(
        <OrdersConfigProvider>
          <div>Different child</div>
          <TestComponentWithSetters />
        </OrdersConfigProvider>,
      );

      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalOrdersConfig),
      );
    });

    test('should handle state updates during loading', async () => {
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

      expect(screen.getByTestId('config-test').textContent).toBe('Loading');

      fireEvent.click(screen.getByTestId('set-config'));
      fireEvent.click(screen.getByTestId('set-loading-false'));

      expect(screen.getByTestId('config-test').textContent).toBe('Loaded');
      expect(screen.getByTestId('config-data').textContent).toBe(
        JSON.stringify(configMocks.minimalOrdersConfig),
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

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
