import {
  getConfig,
  getCurrentUserPrivileges,
  getUserLoginLocation,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useNotification } from '../../../notification';
import CommonSearchWidget from '../CommonSearchWidget';
import { CriterionConfig, CriterionRow, SearchContextConfig } from '../models';
import {
  mockCommonSearchWidgetConfig,
  mockMultiContextConfig,
  mockNumericRangeCriterionConfig,
  mockPrivilegeViewAppointments,
  mockPrivilegeViewPatients,
  mockRowWithEmptyValue,
  mockRowWithRangeOrderError,
  mockRowWithValidValue,
  mockTextCriterionConfig,
  mockWidgetLocation,
} from './__mocks__/commonSearchWidgetMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
  getCurrentUserPrivileges: jest.fn(),
  getUserLoginLocation: jest.fn(),
}));

jest.mock('../../../notification');

let capturedOnSearch:
  | ((rows: CriterionRow[], criteria: CriterionConfig[]) => CriterionRow[])
  | null = null;
let capturedConfig: SearchContextConfig[] | null = null;

jest.mock('../SearchForm', () => ({
  __esModule: true,
  default: ({ onSearch, config }: any) => {
    capturedOnSearch = onSearch;
    capturedConfig = config;
    return <div data-testid="search-form" />;
  },
}));

const mockAddNotification = jest.fn();

describe('CommonSearchWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
    capturedOnSearch = null;
    capturedConfig = null;
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    (getUserLoginLocation as jest.Mock).mockReturnValue(mockWidgetLocation);
    (getCurrentUserPrivileges as jest.Mock).mockResolvedValue(
      mockPrivilegeViewPatients,
    );
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it.each([
    {
      description: 'no configUrl is provided',
      extensionParams: undefined,
      setup: () => {},
    },
    {
      description: 'config fetch fails',
      extensionParams: { configUrl: '/api/config' },
      setup: () =>
        (getConfig as jest.Mock).mockRejectedValueOnce(
          new Error('Failed to fetch config'),
        ),
    },
    {
      description: 'privileges fetch fails',
      extensionParams: { configUrl: '/api/config' },
      setup: () => {
        (getConfig as jest.Mock).mockResolvedValueOnce(
          mockCommonSearchWidgetConfig,
        );
        (getCurrentUserPrivileges as jest.Mock).mockRejectedValueOnce(
          new Error('Failed to fetch privileges'),
        );
      },
    },
  ])(
    'should show error notification when $description',
    async ({ extensionParams, setup }) => {
      setup();
      render(<CommonSearchWidget extensionParams={extensionParams} />, {
        wrapper,
      });
      await waitFor(() => {
        expect(
          screen.getByText('COMMON_SEARCH_CONFIG_ERROR'),
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId('common-search-widget-test-id'),
      ).not.toBeInTheDocument();
    },
  );

  it('should show loading skeleton while config is loading', () => {
    (getConfig as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(
      <CommonSearchWidget extensionParams={{ configUrl: '/api/config' }} />,
      { wrapper },
    );
    expect(
      screen.queryByTestId('common-search-config-loading-test-id'),
    ).toBeInTheDocument();
  });

  it('should show loading skeleton while privileges are loading', () => {
    (getConfig as jest.Mock).mockResolvedValueOnce(
      mockCommonSearchWidgetConfig,
    );
    (getCurrentUserPrivileges as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    render(
      <CommonSearchWidget extensionParams={{ configUrl: '/api/config' }} />,
      { wrapper },
    );
    expect(
      screen.queryByTestId('common-search-config-loading-test-id'),
    ).toBeInTheDocument();
  });

  it('should render widget after config loads successfully', async () => {
    (getConfig as jest.Mock).mockResolvedValueOnce(
      mockCommonSearchWidgetConfig,
    );
    render(
      <CommonSearchWidget extensionParams={{ configUrl: '/api/config' }} />,
      { wrapper },
    );
    await waitFor(() => {
      expect(
        screen.getByTestId('common-search-widget-test-id'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('search-form')).toBeInTheDocument();
    });
  });

  describe('Location guard', () => {
    it('shows no-location error when getUserLoginLocation throws', async () => {
      (getUserLoginLocation as jest.Mock).mockImplementation(() => {
        throw new Error('No location');
      });
      (getConfig as jest.Mock).mockResolvedValueOnce(
        mockCommonSearchWidgetConfig,
      );
      render(
        <CommonSearchWidget extensionParams={{ configUrl: '/api/config' }} />,
        { wrapper },
      );
      await waitFor(() => {
        expect(
          screen.getByText('COMMON_SEARCH_NO_LOCATION_ERROR'),
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId('common-search-widget-test-id'),
      ).not.toBeInTheDocument();
    });

    it('shows widget when location is available', async () => {
      (getConfig as jest.Mock).mockResolvedValueOnce(
        mockCommonSearchWidgetConfig,
      );
      render(
        <CommonSearchWidget extensionParams={{ configUrl: '/api/config' }} />,
        { wrapper },
      );
      await waitFor(() => {
        expect(
          screen.getByTestId('common-search-widget-test-id'),
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByText('COMMON_SEARCH_NO_LOCATION_ERROR'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Privilege guard', () => {
    it.each([
      {
        description: 'getCurrentUserPrivileges returns null',
        privileges: null,
      },
      {
        description: 'user has no privilege matching any context',
        privileges: [{ uuid: 'priv-uuid-x', name: 'Some Other Privilege' }],
      },
    ])('shows no-privilege error when $description', async ({ privileges }) => {
      (getConfig as jest.Mock).mockResolvedValueOnce(
        mockCommonSearchWidgetConfig,
      );
      (getCurrentUserPrivileges as jest.Mock).mockResolvedValueOnce(privileges);
      render(
        <CommonSearchWidget extensionParams={{ configUrl: '/api/config' }} />,
        { wrapper },
      );
      await waitFor(() => {
        expect(
          screen.getByText('COMMON_SEARCH_NO_PRIVILEGE_ERROR'),
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId('common-search-widget-test-id'),
      ).not.toBeInTheDocument();
    });

    it('passes only privileged contexts to SearchForm', async () => {
      (getConfig as jest.Mock).mockResolvedValueOnce(mockMultiContextConfig);
      (getCurrentUserPrivileges as jest.Mock).mockResolvedValueOnce(
        mockPrivilegeViewAppointments,
      );
      render(
        <CommonSearchWidget extensionParams={{ configUrl: '/api/config' }} />,
        { wrapper },
      );
      await waitFor(() => {
        expect(screen.getByTestId('search-form')).toBeInTheDocument();
      });
      expect(capturedConfig).toHaveLength(1);
      expect(capturedConfig![0].context).toBe('appointment');
    });
  });

  describe('handleSearch', () => {
    const renderAndWait = async () => {
      (getConfig as jest.Mock).mockResolvedValueOnce(
        mockCommonSearchWidgetConfig,
      );
      render(
        <CommonSearchWidget extensionParams={{ configUrl: '/api/config' }} />,
        { wrapper },
      );
      await waitFor(() =>
        expect(screen.getByTestId('search-form')).toBeInTheDocument(),
      );
    };

    it('does not call addNotification when rows have validation errors', async () => {
      await renderAndWait();
      capturedOnSearch!([mockRowWithEmptyValue], [mockTextCriterionConfig]);
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('calls addNotification with success type when all rows are valid', async () => {
      await renderAndWait();
      capturedOnSearch!([mockRowWithValidValue], [mockTextCriterionConfig]);
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );
    });

    it('does not call addNotification when range order error exists', async () => {
      await renderAndWait();
      capturedOnSearch!(
        [mockRowWithRangeOrderError],
        [mockNumericRangeCriterionConfig],
      );
      expect(mockAddNotification).not.toHaveBeenCalled();
    });
  });
});
