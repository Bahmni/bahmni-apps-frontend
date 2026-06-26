import * as services from '@bahmni/services';
import { NotificationProvider, useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import ClinicalList from '../index';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
}));

const mockGetConfig = services.getConfig as jest.MockedFunction<
  typeof services.getConfig
>;

const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;

describe('ClinicalList', () => {
  let queryClient: QueryClient;

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <ClinicalList />
        </NotificationProvider>
      </QueryClientProvider>,
    );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: 'priv-1', name: 'app:clinical' }],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });
    mockGetConfig.mockResolvedValue([]);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders the page container with correct test ID', () => {
    renderPage();
    expect(
      screen.getByTestId('clinical-list-page-test-id'),
    ).toBeInTheDocument();
  });

  it('renders the tabs container with correct test ID', () => {
    renderPage();
    expect(
      screen.getByTestId('clinical-list-tabs-test-id'),
    ).toBeInTheDocument();
  });

  it('renders Home breadcrumb with link to BAHMNI_HOME_PATH', () => {
    renderPage();
    const homeLink = screen.getByRole('link', { name: /HOME_LABEL/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', services.BAHMNI_HOME_PATH);
  });

  it('renders Clinical as current page breadcrumb', () => {
    renderPage();
    expect(screen.getByText('CLINICAL_LABEL')).toBeInTheDocument();
  });
});
