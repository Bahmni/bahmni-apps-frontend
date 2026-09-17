import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Regression guard for a bug found in browser testing: ReportsPage renders
// `UserGlobalAction`, which calls `useUserActionRegistry()` and
// `useActivePractitioner()`. Both throw outside their providers, so App must
// supply `UserActionProvider` and `ActivePractitionerProvider` — it originally
// did not, and the app crashed with
// "useUserActionRegistry must be used within UserActionProvider".
//
// This asserts the provider composition rather than mounting the real
// UserGlobalAction. `@bahmni/widgets` does not externalize `@bahmni/services`
// (see packages/bahmni-widgets/vite.config.ts), so its prebuilt dist calls its
// own inlined copy of the service layer; `jest.mock('@bahmni/services')` cannot
// intercept that, and the real providers issue live XHRs under jsdom. Each
// provider is therefore stubbed as a marker element, which still fails loudly
// if one is removed from the tree or nested in the wrong order.
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  initAppI18n: jest.fn().mockResolvedValue(undefined),
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
});
