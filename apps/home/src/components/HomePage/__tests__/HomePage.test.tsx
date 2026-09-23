import { NotificationProvider } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../HomePage';

expect.extend(toHaveNoViolations);

jest.mock('../../HomePageGrid', () => ({
  HomePageGrid: () => <div data-testid="home-page-grid" />,
}));

jest.mock('../../HomePageHeader', () => ({
  HomePageHeader: () => <div data-testid="home-page-header" />,
}));

const renderHomePage = (state?: unknown) =>
  render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
        <HomePage />
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
