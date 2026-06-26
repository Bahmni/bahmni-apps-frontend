import * as services from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { NotificationProvider } from '../../notification';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import Extensions from '../Extensions';
import ExtensionConfigProvider from '../provider';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../userPrivileges/useUserPrivilege');

const mockGetConfig = services.getConfig as jest.MockedFunction<
  typeof services.getConfig
>;
const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;

const defaultPrivilegeContext = {
  userPrivileges: [{ uuid: 'priv-1', name: 'app:clinical' }],
  isLoading: false,
  error: null,
  setUserPrivileges: jest.fn(),
  setIsLoading: jest.fn(),
  setError: jest.fn(),
};

describe('ExtensionConfigProvider', () => {
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
    mockGetConfig.mockResolvedValue([]);
    mockUseUserPrivilege.mockReturnValue(defaultPrivilegeContext);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders children once config resolves', async () => {
    render(
      <TestWrapper>
        <ExtensionConfigProvider configUrl="/test/extensions.json">
          <div data-testid="child" />
        </ExtensionConfigProvider>
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
        <ExtensionConfigProvider configUrl="/test/extensions.json">
          <div data-testid="child" />
        </ExtensionConfigProvider>
      </TestWrapper>,
    );

    expect(
      screen.getByTestId('extension-config-loader-test-id'),
    ).toBeInTheDocument();
  });

  it('shows error state when config fetch fails', async () => {
    mockGetConfig.mockRejectedValueOnce(new Error('Failed'));

    render(
      <TestWrapper>
        <ExtensionConfigProvider configUrl="/test/extensions.json">
          <div data-testid="child" />
        </ExtensionConfigProvider>
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('extension-config-error-test-id'),
      ).toBeInTheDocument();
    });
  });
});

describe('Extensions', () => {
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
    mockGetConfig.mockResolvedValue([]);
    mockUseUserPrivilege.mockReturnValue(defaultPrivilegeContext);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders without crashing when config resolves to empty array', async () => {
    const { container } = render(
      <TestWrapper>
        <Extensions configUrl="/test/extensions.json" />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });
});
