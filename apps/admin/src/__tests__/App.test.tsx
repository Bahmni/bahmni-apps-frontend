import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  initAppI18n: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@bahmni/design-system', () => ({
  Content: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Loading: () => <div data-testid="loading" />,
  initFontAwesome: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  NotificationServiceComponent: () => null,
  UserPrivilegeProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  ActivePractitionerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  UserActionProvider: ({ children }: { children: React.ReactNode }) => children,
  ModuleTileGrid: () => <div data-testid="admin-dashboard-grid-test-id" />,
  useUserPrivilege: () => ({
    userPrivileges: [{ uuid: 'priv-1', name: 'app:admin' }],
    isLoading: false,
    error: null,
    setUserPrivileges: jest.fn(),
    setIsLoading: jest.fn(),
    setError: jest.fn(),
  }),
  useNotification: () => ({
    notifications: [],
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    clearAllNotifications: jest.fn(),
  }),
}));

jest.mock('../components/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout-test-id">{children}</div>
  ),
}));

jest.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

describe('App', () => {
  it('renders the loading state before initialization', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders the app after initialization', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    await waitForElementToBeRemoved(() => screen.queryByTestId('loading'));
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('renders the app even when initialization fails', async () => {
    const { initAppI18n } = jest.requireMock('@bahmni/services');
    initAppI18n.mockRejectedValueOnce(new Error('i18n failed'));

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    await waitForElementToBeRemoved(() => screen.queryByTestId('loading'));
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });
});
