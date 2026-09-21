import { useUserPrivilege } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PrivilegeGuard } from '../PrivilegeGuard';

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
}));

const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;

describe('PrivilegeGuard', () => {
  const renderGuard = (initialPath = '/reports/') =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/reports/"
            element={
              <PrivilegeGuard>
                <div data-testid="guarded-child-test-id">Reports content</div>
              </PrivilegeGuard>
            }
          />
          <Route
            path="/home/"
            element={<div data-testid="home-page-test-id" />}
          />
        </Routes>
      </MemoryRouter>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the children when the user has the app:reports privilege', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: 'priv-1', name: 'app:reports' }],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });

    renderGuard();

    expect(screen.getByTestId('guarded-child-test-id')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page-test-id')).not.toBeInTheDocument();
  });

  it('redirects to home and does not render children when the user lacks the app:reports privilege', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: 'priv-1', name: 'app:clinical' }],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });

    renderGuard();

    expect(screen.getByTestId('home-page-test-id')).toBeInTheDocument();
    expect(
      screen.queryByTestId('guarded-child-test-id'),
    ).not.toBeInTheDocument();
  });

  it('shows a loading indicator and does not redirect while privileges are unsettled', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: null,
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });

    renderGuard();

    expect(
      screen.getByTestId('privilege-guard-loading-test-id'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('home-page-test-id')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('guarded-child-test-id'),
    ).not.toBeInTheDocument();
  });
});
