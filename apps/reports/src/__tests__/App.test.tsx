import * as bahmniServices from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  initAppI18n: jest.fn().mockResolvedValue(undefined),
  initializeAuditListener: jest.fn(),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@bahmni/widgets', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="notification-provider">{children}</div>
  ),
  NotificationServiceComponent: () => null,
  UserPrivilegeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="user-privilege-provider">{children}</div>
  ),
  ActivePractitionerProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="active-practitioner-provider">{children}</div>
  ),
  UserActionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="user-action-provider">{children}</div>
  ),
  UserGlobalAction: () => <div data-testid="user-global-action-test-id" />,
  useUserPrivilege: () => ({
    userPrivileges: [{ uuid: 'priv-1', name: 'app:reports' }],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

const renderApp = (initialPath = '/reports/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );

describe('App', () => {
  it('renders the reports page once initialized', async () => {
    renderApp();

    expect(await screen.findByTestId('reports-page-test-id')).toBeVisible();
  });

  it('supplies ActivePractitionerProvider, which UserGlobalAction requires', async () => {
    renderApp();
    await screen.findByTestId('reports-page-test-id');

    expect(
      screen.getByTestId('active-practitioner-provider'),
    ).toBeInTheDocument();
  });

  it('supplies UserActionProvider, which UserGlobalAction requires', async () => {
    renderApp();
    await screen.findByTestId('reports-page-test-id');

    expect(screen.getByTestId('user-action-provider')).toBeInTheDocument();
  });

  it('nests the providers so the page is inside all of them', async () => {
    renderApp();
    const page = await screen.findByTestId('reports-page-test-id');

    const userAction = screen.getByTestId('user-action-provider');
    const activePractitioner = screen.getByTestId(
      'active-practitioner-provider',
    );
    const userPrivilege = screen.getByTestId('user-privilege-provider');

    expect(userAction).toContainElement(page);
    expect(activePractitioner).toContainElement(userAction);
    expect(userPrivilege).toContainElement(activePractitioner);
  });

  it('still initializes and logs error if i18n initialization fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const initError = new Error('i18n init failed');

    jest.mocked(bahmniServices.initAppI18n).mockRejectedValueOnce(initError);

    renderApp();

    expect(await screen.findByTestId('reports-page-test-id')).toBeVisible();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to initialize app:',
      initError,
    );

    consoleErrorSpy.mockRestore();
  });
});
