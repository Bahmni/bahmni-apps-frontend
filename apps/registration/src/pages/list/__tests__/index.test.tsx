import * as services from '@bahmni/services';
import { NotificationProvider, useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useRegistrationConfig } from '../../../providers/registrationConfig';
import RegistrationList from '../index';
import {
  mockOtherExtension,
  mockPrivilegedSearchExtension,
  mockSearchExtension,
} from './__mocks__/listMocks';

expect.extend(toHaveNoViolations);

jest.mock('../constants', () => ({
  EXTENSION_HANDLERS: {
    'org.bahmni.registration.v2.search': () => (
      <div data-testid="mock-search-handler-test-id" />
    ),
  },
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
}));

jest.mock('../../../providers/registrationConfig');

const mockUseRegistrationConfig = useRegistrationConfig as jest.MockedFunction<
  typeof useRegistrationConfig
>;

const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;

describe('RegistrationList', () => {
  let queryClient: QueryClient;

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <RegistrationList />
        </NotificationProvider>
      </QueryClientProvider>,
    );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: 'priv-1', name: 'app:registration' }],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: { extensions: [] } as any,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders breadcrumb navigation', () => {
    renderPage();
    const homeLink = screen.getByRole('link', { name: /HOME_LABEL/i });
    expect(homeLink).toHaveAttribute('href', services.BAHMNI_HOME_PATH);
    expect(screen.getByText('REGISTRATION_LABEL')).toBeInTheDocument();
  });

  it('renders extension handler container when a registered extension is configured', () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: { extensions: [mockSearchExtension] } as any,
      isLoading: false,
      error: null,
    });
    renderPage();
    expect(
      screen.getByTestId('org.bahmni.registration.v2.search-test-id'),
    ).toBeInTheDocument();
  });

  it.each([
    {
      description: 'extensions array is empty',
      registrationConfig: { extensions: [] },
      userPrivileges: [{ uuid: 'priv-1', name: 'app:registration' }],
    },
    {
      description: 'registrationConfig has no extensions property',
      registrationConfig: {},
      userPrivileges: [{ uuid: 'priv-1', name: 'app:registration' }],
    },
    {
      description: 'user lacks required privilege',
      registrationConfig: { extensions: [mockPrivilegedSearchExtension] },
      userPrivileges: [{ uuid: 'priv-2', name: 'app:admin' }],
    },
    {
      description: 'extension point has no registered handler',
      registrationConfig: { extensions: [mockOtherExtension] },
      userPrivileges: [{ uuid: 'priv-1', name: 'app:registration' }],
    },
  ])(
    'shows no extensions configured message when $description',
    ({ registrationConfig, userPrivileges }) => {
      mockUseUserPrivilege.mockReturnValue({
        userPrivileges,
        isLoading: false,
        error: null,
        setUserPrivileges: jest.fn(),
        setIsLoading: jest.fn(),
        setError: jest.fn(),
      });
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: registrationConfig as any,
        isLoading: false,
        error: null,
      });
      renderPage();
      expect(
        screen.getByTestId('no-extensions-configured-test-id'),
      ).toBeInTheDocument();
    },
  );

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderPage();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderPage();
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
