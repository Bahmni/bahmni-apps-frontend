import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

jest.mock('@bahmni/services', () => ({
  initAppI18n: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@bahmni/design-system', () => ({
  Loading: () => <div data-testid="loading" />,
  initFontAwesome: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  NotificationServiceComponent: () => null,
  UserPrivilegeProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

describe('App', () => {
  it('renders loading state before initialization', () => {
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
