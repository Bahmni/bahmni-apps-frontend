import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PrivilegeGuard } from '..';
import { APPOINTMENTS_PRIVILEGE } from '../../../constants/app';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  hasPrivilege: jest.fn(),
}));

const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
const { hasPrivilege } = jest.requireMock('@bahmni/services');

// Stands in for the home app: reports the router state handed over on redirect.
const HomeProbe = () => {
  const { state } = useLocation();
  return (
    <div data-testid="home-page">
      {JSON.stringify((state as Record<string, unknown>) ?? null)}
    </div>
  );
};

const renderGuard = () =>
  render(
    <MemoryRouter initialEntries={['/appointments-content']}>
      <Routes>
        <Route
          path="/appointments-content"
          element={
            <PrivilegeGuard>
              <div data-testid="guarded-content">Guarded content</div>
            </PrivilegeGuard>
          }
        />
        <Route path="/home/" element={<HomeProbe />} />
      </Routes>
    </MemoryRouter>,
  );

describe('PrivilegeGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loading indicator while privileges are loading', () => {
    useUserPrivilege.mockReturnValue({ userPrivileges: null, isLoading: true });
    hasPrivilege.mockReturnValue(false);

    renderGuard();

    expect(
      screen.getByTestId('appointments-privilege-guard-loading-test-id'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  it('renders children when the user has the privilege', () => {
    useUserPrivilege.mockReturnValue({
      userPrivileges: [{ name: APPOINTMENTS_PRIVILEGE }],
      isLoading: false,
    });
    hasPrivilege.mockReturnValue(true);

    renderGuard();

    expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  it('redirects straight to /home/ when the privilege is missing', () => {
    useUserPrivilege.mockReturnValue({ userPrivileges: [], isLoading: false });
    hasPrivilege.mockReturnValue(false);

    renderGuard();

    // No intermediate access-denied screen — the redirect is immediate.
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument();
  });

  it('hands the access-denied message off to home via router state', () => {
    useUserPrivilege.mockReturnValue({ userPrivileges: [], isLoading: false });
    hasPrivilege.mockReturnValue(false);

    renderGuard();

    expect(JSON.parse(screen.getByTestId('home-page').textContent!)).toEqual({
      accessDenied: { app: 'Appointments' },
    });
  });

  it('has no accessibility violations while loading', async () => {
    useUserPrivilege.mockReturnValue({ userPrivileges: null, isLoading: true });
    hasPrivilege.mockReturnValue(false);

    const { container } = renderGuard();
    expect(await axe(container)).toHaveNoViolations();
  });
});
