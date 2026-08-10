import { useTranslation } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as configMocks from '../../__mocks__/configMocks';
import { OrdersConfigProvider } from '../../providers/OrdersConfigProvider';
import { OrdersPage } from '../OrdersPage';

// Mock the services
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getOrdersConfig: jest.fn(),
  getOrdersTableConfig: jest.fn(),
  useTranslation: jest.fn(),
  notificationService: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  },
  getFormattedError: jest.fn((error) => ({
    title: 'Error',
    message:
      error instanceof Error ? error.message : 'An unexpected error occurred',
  })),
  __esModule: true,
}));

// Mock OrdersHeader
jest.mock('../../components/ordersHeader/OrdersHeader', () => ({
  __esModule: true,
  OrdersHeader: () => <div data-testid="orders-header">Orders Header</div>,
}));

// Mock useOrdersFulfillment
jest.mock('../../hooks/useOrdersFulfillment', () => ({
  useOrdersFulfillment: () => ({
    rows: [],
    headers: [
      { key: 'badge', header: '' },
      { key: 'patientName', header: 'Patient Name' },
      { key: 'identifier', header: 'Identifier' },
    ],
    isLoading: false,
    error: null,
    isDrugOrderTab: false,
  }),
}));

// Mock OrdersFulfillmentTable
jest.mock('../../components/ordersFulfillmentTable', () => ({
  OrdersFulfillmentTable: () => (
    <div data-testid="orders-fulfillment-table">Orders Table</div>
  ),
}));

const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

const { getOrdersConfig, getOrdersTableConfig } =
  jest.requireMock('@bahmni/services');

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('OrdersPage Component', () => {
  const mockTranslate = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      MODULE_LABEL_RADIOLOGY_ORDERS_KEY: 'Radiology Orders',
      MODULE_LABEL_LAB_ORDERS_KEY: 'Laboratory Orders',
      MODULE_LABEL_REHAB_ORDERS_KEY: 'Rehab Orders',
      MODULE_LABEL_DRUG_ORDERS_KEY: 'Drug Orders',
      ERROR_LOADING_ORDERS_CONFIG: 'Error loading orders configuration',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
    getOrdersTableConfig.mockResolvedValue(null);
  });

  describe('Rendering', () => {
    test('renders loading state initially', () => {
      getOrdersConfig.mockImplementationOnce(
        () =>
          new Promise(() => {
            // Never resolves to keep loading state
          }),
      );

      const { container } = render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      // Check for Carbon Design System loading overlay
      expect(
        container.querySelector('.cds--loading-overlay'),
      ).toBeInTheDocument();
    });

    test('renders OrdersHeader component after loading', async () => {
      getOrdersConfig.mockResolvedValueOnce(configMocks.minimalOrdersConfig);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when configuration fails to load', async () => {
      const error = new Error('Failed to load configuration');
      getOrdersConfig.mockRejectedValueOnce(error);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Error loading orders configuration/i),
        ).toBeInTheDocument();
      });
    });

    test('shows error with error message', async () => {
      const error = new Error('Network error');
      getOrdersConfig.mockRejectedValueOnce(error);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    test('handles empty configuration gracefully', async () => {
      getOrdersConfig.mockResolvedValueOnce(configMocks.emptyOrdersConfig);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });
    });

    test('handles null configuration', async () => {
      getOrdersConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });
    });
  });
});
