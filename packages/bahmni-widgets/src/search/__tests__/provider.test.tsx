import * as services from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { NotificationProvider } from '../../notification';
import SearchWidgetConfigProvider, { withSearchConfig } from '../provider';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockGetConfig = services.getConfig as jest.MockedFunction<
  typeof services.getConfig
>;

const MockWidget = () => <div data-testid="mock-widget" />;
MockWidget.displayName = 'MockWidget';

describe('SearchWidgetConfigProvider', () => {
  let queryClient: QueryClient;

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>{children}</NotificationProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
    mockGetConfig.mockResolvedValue({});
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders children once config resolves', async () => {
    render(
      <TestWrapper>
        <SearchWidgetConfigProvider configUrl="/test/config.json">
          <div data-testid="child" />
        </SearchWidgetConfigProvider>
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  it('shows loading state while config is being fetched', () => {
    mockGetConfig.mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <SearchWidgetConfigProvider configUrl="/test/config.json">
          <div data-testid="child" />
        </SearchWidgetConfigProvider>
      </TestWrapper>,
    );

    expect(
      screen.getByTestId('search-widget-config-loader-test-id'),
    ).toBeInTheDocument();
  });

  it('shows error state when config fetch fails', async () => {
    mockGetConfig.mockRejectedValueOnce(new Error('Failed'));

    render(
      <TestWrapper>
        <SearchWidgetConfigProvider configUrl="/test/config.json">
          <div data-testid="child" />
        </SearchWidgetConfigProvider>
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('search-widget-config-error-test-id'),
      ).toBeInTheDocument();
    });
  });
});

describe('withSearchConfig', () => {
  let queryClient: QueryClient;

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>{children}</NotificationProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
    mockGetConfig.mockResolvedValue({});
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders null when configUrl is not provided', () => {
    const Wrapped = withSearchConfig(MockWidget);
    const { container } = render(<Wrapped />, { wrapper: TestWrapper });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the wrapped widget when configUrl is provided', async () => {
    const Wrapped = withSearchConfig(MockWidget);

    render(<Wrapped configUrl="/test/config.json" />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
    });
  });

  it('sets displayName using displayName when available', () => {
    const Wrapped = withSearchConfig(MockWidget);
    expect(Wrapped.displayName).toBe('WithSearchConfig(MockWidget)');
  });

  it('falls back to component name when displayName is not set', () => {
    const NoDisplayName = () => <div />;
    const Wrapped = withSearchConfig(NoDisplayName);
    expect(Wrapped.displayName).toBe('WithSearchConfig(NoDisplayName)');
  });
});
