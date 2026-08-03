import {
  dispatchAuditEvent,
  getConfig,
  getCurrentUserPrivileges,
  getUserLoginLocation,
  post,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import CommonSearchWidget from '../CommonSearchWidget';
import { CriterionRow, SearchContextConfig } from '../models';
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

const mockPost = post as jest.Mock;
const mockDispatchAuditEvent = dispatchAuditEvent as jest.Mock;

const mockAddNotification = jest.fn();
jest.mock('../../../notification', () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
  getCurrentUserPrivileges: jest.fn(),
  getUserLoginLocation: jest.fn(),
  post: jest.fn(),
  dispatchAuditEvent: jest.fn(),
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
  default: () => <div data-testid="search-summary" />,
}));

jest.mock('../ResultsTable', () => ({
  __esModule: true,
  default: () => <div data-testid="results-table" />,
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
      await act(async () => {
        capturedOnSearch!(
          [mockRowWithValidValue],
          mockCommonSearchWidgetConfig[0],
        );
      });
      expect(mockPost).toHaveBeenCalledWith(
        mockCommonSearchWidgetConfig[0].url,
        expect.objectContaining({
          entity: mockCommonSearchWidgetConfig[0].context,
        }),
      );
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

    it('shows loading overlay over search form while search is in progress', async () => {
      mockPost.mockReturnValue(new Promise(() => {}));
      await renderAndWait();
      await act(async () => {
        capturedOnSearch!(
          [mockRowWithValidValue],
          mockCommonSearchWidgetConfig[0],
        );
      });
      expect(
        screen.getByTestId('common-search-loading-overlay-test-id'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('search-form')).toBeInTheDocument();
    });

    it('hides loading overlay, shows error toast and returns to search form when search API fails', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));
      await renderAndWait();
      await act(async () => {
        capturedOnSearch!(
          [mockRowWithValidValue],
          mockCommonSearchWidgetConfig[0],
        );
      });
      expect(
        screen.queryByTestId('common-search-loading-overlay-test-id'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('search-form')).toBeInTheDocument();
      expect(screen.queryByTestId('search-summary')).not.toBeInTheDocument();
      expect(screen.queryByTestId('results-table')).not.toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'ERROR_DEFAULT_TITLE',
        message: 'COMMON_SEARCH_API_ERROR_MESSAGE',
        type: 'error',
        timeout: 5000,
      });
    });

    it.each([
      { context: 'patient' as const, expectedEventType: 'SEARCHED_PATIENT' },
      {
        context: 'appointment' as const,
        expectedEventType: 'SEARCHED_APPOINTMENT',
      },
      {
        context: 'patientProgram' as const,
        expectedEventType: 'SEARCHED_PATIENT_PROGRAM',
      },
    ])(
      'dispatches $expectedEventType audit event on successful $context search',
      async ({ context, expectedEventType }) => {
        const contextConfig = { ...mockCommonSearchWidgetConfig[0], context };
        (getConfig as jest.Mock).mockResolvedValueOnce([contextConfig]);
        render(
          <CommonSearchWidget extensionParams={{ configUrl: '/api/config' }} />,
          { wrapper },
        );
        await screen.findByTestId('search-form');
        await act(async () => {
          capturedOnSearch!([mockRowWithValidValue], contextConfig);
        });
        expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
          eventType: expectedEventType,
        });
      },
    );

    it('does not dispatch audit event when validation fails', async () => {
      await renderAndWait();
      capturedOnSearch!(
        [mockRowWithEmptyValue],
        mockCommonSearchWidgetConfig[0],
      );
      expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    });

    it('does not dispatch audit event when search API fails', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));
      await renderAndWait();
      await act(async () => {
        capturedOnSearch!(
          [mockRowWithValidValue],
          mockCommonSearchWidgetConfig[0],
        );
      });
      expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('accordion panel behavior', () => {
    const renderAndSearch = async (results: unknown[] = [{ id: '1' }]) => {
      mockPost.mockResolvedValue({ results });
      (getConfig as jest.Mock).mockResolvedValueOnce(
        mockCommonSearchWidgetConfig,
      );
      render(
        <CommonSearchWidget extensionParams={{ configUrl: '/api/config' }} />,
        { wrapper },
      );
      await screen.findByTestId('search-form');
      await act(async () => {
        capturedOnSearch!(
          [mockRowWithValidValue],
          mockCommonSearchWidgetConfig[0],
        );
      });
    };

    it('collapses accordion and show results table below accordion after successful search with results', async () => {
      await renderAndSearch([{ id: '1' }]);
      expect(
        screen.getByRole('button', {
          name: 'COMMON_SEARCH_MODIFY_SEARCH_BUTTON',
        }),
      ).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByTestId('search-summary')).toBeInTheDocument();
      expect(screen.getByTestId('results-table')).toBeInTheDocument();
    });

    it('keeps accordion open after search returns empty results', async () => {
      await renderAndSearch([]);
      expect(
        screen.getByRole('button', {
          name: 'COMMON_SEARCH_MODIFY_SEARCH_BUTTON',
        }),
      ).toHaveAttribute('aria-expanded', 'true');
    });

    it('results table remains visible when accordion is toggled open', async () => {
      await renderAndSearch([{ id: '1' }]);
      fireEvent.click(
        screen.getByRole('button', {
          name: 'COMMON_SEARCH_MODIFY_SEARCH_BUTTON',
        }),
      );
      expect(screen.getByTestId('search-summary')).toBeInTheDocument();
      expect(screen.getByTestId('results-table')).toBeInTheDocument();
    });

    it('accordion title changes to modify search after first successful search', async () => {
      await renderAndSearch([{ id: '1' }]);
      expect(
        screen.getByRole('button', {
          name: 'COMMON_SEARCH_MODIFY_SEARCH_BUTTON',
        }),
      ).toBeInTheDocument();
    });

    it('accordion title shows select criteria before any search', async () => {
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
      expect(
        screen.getByRole('button', {
          name: 'COMMON_SEARCH_SELECT_SEARCH_CRITERIA',
        }),
      ).toBeInTheDocument();
    });
  });
});
