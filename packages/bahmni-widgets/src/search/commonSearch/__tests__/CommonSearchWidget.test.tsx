import {
  getConfig,
  getCurrentUserPrivileges,
  getUserLoginLocation,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { post } from '../api';
import CommonSearchWidget from '../CommonSearchWidget';
import {
  ActiveSearchState,
  CriterionRow,
  SearchContextConfig,
} from '../models';
import {
  mockCommonSearchWidgetConfig,
  mockCommonSearchWidgetConfigWithRange,
  mockMultiContextConfig,
  mockPrivilegeViewAppointments,
  mockPrivilegeViewPatients,
  mockRowWithEmptyValue,
  mockRowWithRangeOrderError,
  mockRowWithValidValue,
  mockWidgetLocation,
} from './__mocks__/commonSearchWidgetMocks';

jest.mock('../api', () => ({
  post: jest.fn(),
}));
const mockPost = post as jest.Mock;

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
  getCurrentUserPrivileges: jest.fn(),
  getUserLoginLocation: jest.fn(),
}));

let capturedOnSearch:
  | ((rows: CriterionRow[], context: SearchContextConfig) => CriterionRow[])
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

jest.mock('../SearchSummary', () => ({
  __esModule: true,
  default: ({
    onModifySearch,
  }: {
    activeSearchState: ActiveSearchState;
    onModifySearch: () => void;
  }) => (
    <div data-testid="search-summary">
      <button onClick={onModifySearch}>Modify Search</button>
    </div>
  ),
}));

let capturedIsLoading: boolean | null = null;
let capturedApiError: string | null | undefined = undefined;

jest.mock('../ResultsTable', () => ({
  __esModule: true,
  default: ({
    isLoading,
    apiError,
  }: {
    isLoading: boolean;
    apiError: string | null;
  }) => {
    capturedIsLoading = isLoading;
    capturedApiError = apiError;
    return <div data-testid="results-table" />;
  },
}));

describe('CommonSearchWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
    capturedOnSearch = null;
    capturedConfig = null;
    capturedIsLoading = null;
    capturedApiError = undefined;
    mockPost.mockResolvedValue({ results: [] });
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

    it('calls post with url and built payload when all rows are valid', async () => {
      await renderAndWait();
      capturedOnSearch!(
        [mockRowWithValidValue],
        mockCommonSearchWidgetConfig[0],
      );
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          mockCommonSearchWidgetConfig[0].url,
          expect.objectContaining({
            entity: mockCommonSearchWidgetConfig[0].context,
          }),
        );
      });
    });

    it('does not call post when rows have validation errors', async () => {
      await renderAndWait();
      capturedOnSearch!(
        [mockRowWithEmptyValue],
        mockCommonSearchWidgetConfig[0],
      );
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('does not call post when range order error exists', async () => {
      (getConfig as jest.Mock).mockResolvedValueOnce(
        mockCommonSearchWidgetConfigWithRange,
      );
      render(
        <CommonSearchWidget extensionParams={{ configUrl: '/api/config' }} />,
        { wrapper },
      );
      await waitFor(() =>
        expect(screen.getByTestId('search-form')).toBeInTheDocument(),
      );
      capturedOnSearch!(
        [mockRowWithRangeOrderError],
        mockCommonSearchWidgetConfigWithRange[0],
      );
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('shows search summary and results table immediately with isLoading true on valid search', async () => {
      mockPost.mockReturnValue(new Promise(() => {}));
      await renderAndWait();
      capturedOnSearch!(
        [mockRowWithValidValue],
        mockCommonSearchWidgetConfig[0],
      );
      await waitFor(() => {
        expect(screen.getByTestId('search-summary')).toBeInTheDocument();
        expect(screen.getByTestId('results-table')).toBeInTheDocument();
      });
      expect(capturedIsLoading).toBe(true);
      expect(capturedApiError).toBeNull();
    });

    it('passes apiError to ResultsTable when post fails', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));
      await renderAndWait();
      capturedOnSearch!(
        [mockRowWithValidValue],
        mockCommonSearchWidgetConfig[0],
      );
      await waitFor(() => {
        expect(capturedIsLoading).toBe(false);
        expect(capturedApiError).toBe('COMMON_SEARCH_API_ERROR_MESSAGE');
      });
    });
  });

  describe('handleModifySearch', () => {
    it('returns to search form and hides results when Modify Search is clicked', async () => {
      mockPost.mockReturnValue(new Promise(() => {}));
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
      capturedOnSearch!(
        [mockRowWithValidValue],
        mockCommonSearchWidgetConfig[0],
      );
      await waitFor(() =>
        expect(screen.getByTestId('search-summary')).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Modify Search' }));
      await waitFor(() =>
        expect(screen.getByTestId('search-form')).toBeInTheDocument(),
      );
      expect(screen.queryByTestId('search-summary')).not.toBeInTheDocument();
      expect(screen.queryByTestId('results-table')).not.toBeInTheDocument();
    });
  });
});
