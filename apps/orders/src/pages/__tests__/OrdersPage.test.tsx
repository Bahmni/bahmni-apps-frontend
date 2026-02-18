import { useTranslation } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import * as configMocks from '../../__mocks__/configMocks';
import { rehabOrdersMockData } from '../../__mocks__/ordersMockData';
import { OrdersConfigProvider } from '../../providers/OrdersConfigProvider';
import useOrdersStore from '../../stores/ordersStore';
import { OrdersPage } from '../OrdersPage';

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

jest.mock('../../components/ordersHeader/OrdersHeader', () => ({
  __esModule: true,
  OrdersHeader: () => <div data-testid="orders-header">Orders Header</div>,
}));

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

jest.mock('../../components/ordersFulfillmentTable', () => ({
  OrdersFulfillmentTable: ({ rows }: { rows: any[] }) => (
    <div data-testid="orders-fulfillment-table">
      {rows.map((row: any) => (
        <div
          key={row.id}
          data-testid="patient-row"
          data-urgent-count={row.urgentCount}
        >
          {row.patientName}
        </div>
      ))}
    </div>
  ),
}));

const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

const { getOrdersConfig, getOrdersTableConfig } =
  jest.requireMock('@bahmni/services');

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

  describe('Search Functionality', () => {
    beforeEach(() => {
      getOrdersConfig.mockResolvedValue(configMocks.minimalOrdersConfig);
    });

    test('renders search input with correct placeholder', async () => {
      const translateFn = jest.fn((key: string) => {
        const translations: Record<string, string> = {
          SEARCH_ORDERS_PLACEHOLDER:
            'Search by Patient Name, Identifier, Provider or Owner',
          SEARCH_ORDERS_LABEL: 'Search orders',
          CLEAR_SEARCH_INPUT: 'Clear search input',
        };
        return translations[key] || key;
      });
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(
          'Search by Patient Name, Identifier, Provider or Owner',
        );
        expect(searchInput).toBeInTheDocument();
      });
    });

    test('updates search input value when user types', async () => {
      const user = userEvent.setup();
      const translateFn = jest.fn((key: string) => key);
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'David');

      expect(searchInput).toHaveValue('David');
    });

    test('search input accepts minimum 3 characters', async () => {
      const user = userEvent.setup();
      const translateFn = jest.fn((key: string) => key);
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');

      await user.type(searchInput, 'Da');
      expect(searchInput).toHaveValue('Da');

      await user.type(searchInput, 'v');
      expect(searchInput).toHaveValue('Dav');
    });

    test('clears search input when clear button is clicked', async () => {
      const user = userEvent.setup();
      const translateFn = jest.fn((key: string) => key);
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'David');
      expect(searchInput).toHaveValue('David');

      await user.clear(searchInput);
      expect(searchInput).toHaveValue('');
    });

    test('search is case-insensitive', async () => {
      const user = userEvent.setup();
      const translateFn = jest.fn((key: string) => key);
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');

      await user.type(searchInput, 'david');
      expect(searchInput).toHaveValue('david');

      await user.clear(searchInput);
      await user.type(searchInput, 'DAVID');
      expect(searchInput).toHaveValue('DAVID');

      await user.clear(searchInput);
      await user.type(searchInput, 'DaViD');
      expect(searchInput).toHaveValue('DaViD');
    });

    test('trims whitespace from search input', async () => {
      const user = userEvent.setup();
      const translateFn = jest.fn((key: string) => key);
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');

      await user.type(searchInput, '  David  ');
      expect(searchInput).toHaveValue('  David  ');
    });
  });

  describe('Search Filtering - Filtered Results', () => {
    beforeEach(() => {
      getOrdersConfig.mockResolvedValue(configMocks.minimalOrdersConfig);
      mockedUseTranslation.mockReturnValue({
        t: (key: string) => key,
      } as any);
      useOrdersStore.setState({
        ordersData: { 'Radiology Order': rehabOrdersMockData },
      });
    });

    afterEach(() => {
      useOrdersStore.setState({ ordersData: {} });
    });

    const renderPage = () =>
      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

    const waitForPage = () =>
      waitFor(() =>
        expect(screen.getByTestId('orders-header')).toBeInTheDocument(),
      );

    test('filters rows by patient name', async () => {
      const user = userEvent.setup();
      renderPage();
      await waitForPage();

      await user.type(screen.getByRole('searchbox'), 'David');

      await waitFor(() => {
        expect(screen.getByText('David Kamau')).toBeInTheDocument();
        expect(screen.queryByText('Samuel Mensah')).not.toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    test('filters rows by patient identifier', async () => {
      const user = userEvent.setup();
      renderPage();
      await waitForPage();

      await user.type(screen.getByRole('searchbox'), 'CRK266785');

      await waitFor(() => {
        expect(screen.getByText('Samuel Mensah')).toBeInTheDocument();
        expect(screen.queryByText('David Kamau')).not.toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    test('filters rows by provider name', async () => {
      const user = userEvent.setup();
      renderPage();
      await waitForPage();

      await user.type(screen.getByRole('searchbox'), 'Sarah Kimani');

      await waitFor(() => {
        expect(screen.getByText('Samuel Mensah')).toBeInTheDocument();
        expect(screen.queryByText('David Kamau')).not.toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    test('filters rows by owner name', async () => {
      const user = userEvent.setup();
      renderPage();
      await waitForPage();

      await user.type(screen.getByRole('searchbox'), 'Ted Okatch');

      await waitFor(() => {
        expect(screen.getByText('David Kamau')).toBeInTheDocument();
        expect(screen.queryByText('Samuel Mensah')).not.toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    test('recalculates urgentCount for orders matched by provider name', async () => {
      // David Kamau has 3 orders all by provider 'Mike Ronoh':
      //   order-1-1: STAT priority
      //   order-1-2: ROUTINE priority
      //   order-1-3: ROUTINE priority
      // Searching 'Mike Ronoh' matches by provider (not patient name/id),
      // so filteredRows recalculates urgentCount = 1 (only the STAT order).
      const user = userEvent.setup();
      renderPage();
      await waitForPage();

      await user.type(screen.getByRole('searchbox'), 'Mike Ronoh');

      await waitFor(() => {
        const davidRow = screen
          .getByText('David Kamau')
          .closest('[data-testid="patient-row"]');
        expect(davidRow).toBeInTheDocument();
        expect(davidRow).toHaveAttribute('data-urgent-count', '1');
      });
    });
  });
});
