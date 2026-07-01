import { getConfig } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import CommonSearchWidget from '../CommonSearchWidget';
import { mockCommonSearchWidgetConfig } from './__mocks__/commonSearchWidgetMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));

describe('CommonSearchWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
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
    });
  });
});
