import { NotificationProvider } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { HomePage } from '../HomePage';

expect.extend(toHaveNoViolations);

jest.mock('../../HomePageGrid', () => ({
  HomePageGrid: () => <div data-testid="home-page-grid" />,
}));

jest.mock('../../HomePageHeader', () => ({
  HomePageHeader: () => <div data-testid="home-page-header" />,
}));

// Reports the current router state so tests can assert it was consumed.
const LocationStateProbe = () => {
  const { state } = useLocation();
  return <div data-testid="location-state">{JSON.stringify(state)}</div>;
};

const renderHomePage = (state?: unknown) =>
  render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
        <HomePage />
        <LocationStateProbe />
      </MemoryRouter>
    </NotificationProvider>,
  );

describe('HomePage', () => {
  it('renders the page header', () => {
    renderHomePage();
    expect(screen.getByTestId('home-page-header')).toBeInTheDocument();
  });

  it('renders the page grid', () => {
    renderHomePage();
    expect(screen.getByTestId('home-page-grid')).toBeInTheDocument();
  });

  it('shows no notification when there is no router state', () => {
    renderHomePage();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('shows an access-denied notification when redirected by a privilege guard', () => {
    renderHomePage({ accessDenied: { app: 'Appointments' } });

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText('You do not have permission to access Appointments.'),
    ).toBeInTheDocument();
  });

  it('clears the access-denied state once the notification is shown', () => {
    renderHomePage({ accessDenied: { app: 'Appointments' } });

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByTestId('location-state')).toHaveTextContent('null');
  });

  it('does not stack duplicate access-denied notifications on re-render', () => {
    const { rerender } = renderHomePage({
      accessDenied: { app: 'Appointments' },
    });

    rerender(
      <NotificationProvider>
        <MemoryRouter
          initialEntries={[
            { pathname: '/', state: { accessDenied: { app: 'Appointments' } } },
          ]}
        >
          <HomePage />
        </MemoryRouter>
      </NotificationProvider>,
    );

    expect(screen.getAllByText('Access Denied')).toHaveLength(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderHomePage();
    expect(await axe(container)).toHaveNoViolations();
  });
});
