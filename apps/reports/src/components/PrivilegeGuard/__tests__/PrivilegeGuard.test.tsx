import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PrivilegeGuard } from '../PrivilegeGuard';

expect.extend(toHaveNoViolations);

const mockAddNotification = jest.fn();

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
  useNotification: jest.fn(),
}));

const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
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
    mockUseNotification.mockReturnValue({
      notifications: [],
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
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

  it('shows a privilege-denied global notification and a persistent fallback message, without redirecting or rendering children, when the user lacks the app:reports privilege', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: 'priv-1', name: 'app:clinical' }],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });

    renderGuard();

    expect(mockAddNotification).toHaveBeenCalledWith({
      title: 'Error',
      message: 'You do not have permission to access reports',
      type: 'error',
    });
    expect(screen.getByTestId('privilege-guard-denied')).toHaveTextContent(
      'You do not have permission to access reports',
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute(
      'href',
      '/bahmni-v2/home',
    );
    expect(screen.queryByTestId('home-page-test-id')).not.toBeInTheDocument();
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

  it('shows a persistent fallback message but no duplicate toast (the provider already toasts the fetch failure), and does not redirect or render children, when the privilege fetch fails', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: null,
      isLoading: false,
      error: new Error('Network error'),
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });

    renderGuard();

    expect(mockAddNotification).not.toHaveBeenCalled();
    expect(screen.getByTestId('privilege-guard-denied')).toHaveTextContent(
      'Unable to verify your access to reports',
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page-test-id')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('guarded-child-test-id'),
    ).not.toBeInTheDocument();
  });

  it('renders the denied state without throwing (the Back to Home link must not be nested inside InlineNotification)', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: 'priv-1', name: 'app:clinical' }],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });

    expect(() => renderGuard()).not.toThrow();
  });

  it('has no accessibility violations when access is granted', async () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: 'priv-1', name: 'app:reports' }],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });

    const { container } = renderGuard();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations when access is denied', async () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: 'priv-1', name: 'app:clinical' }],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });

    const { container } = renderGuard();
    expect(await axe(container)).toHaveNoViolations();
  });
});
