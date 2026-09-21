import { hasPrivilege } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PrivilegeGuard } from '../PrivilegeGuard';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  hasPrivilege: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
  UserGlobalAction: () => <div data-testid="user-global-action-test-id" />,
}));

const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;
const mockHasPrivilege = hasPrivilege as jest.MockedFunction<
  typeof hasPrivilege
>;

const privilegeState = (
  overrides: Partial<ReturnType<typeof useUserPrivilege>>,
): ReturnType<typeof useUserPrivilege> => ({
  userPrivileges: null,
  isLoading: false,
  error: null,
  setUserPrivileges: jest.fn(),
  setIsLoading: jest.fn(),
  setError: jest.fn(),
  ...overrides,
});

const renderGuard = () =>
  render(
    <PrivilegeGuard>
      <div data-testid="protected-content-test-id">Protected</div>
    </PrivilegeGuard>,
  );

describe('PrivilegeGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the children when the user has the app:admin privilege', () => {
    mockUseUserPrivilege.mockReturnValue(
      privilegeState({
        userPrivileges: [{ uuid: 'priv-1', name: 'app:admin' }],
      }),
    );
    mockHasPrivilege.mockReturnValue(true);

    renderGuard();

    expect(screen.getByTestId('protected-content-test-id')).toBeInTheDocument();
    expect(
      screen.queryByTestId('admin-access-denied-test-id'),
    ).not.toBeInTheDocument();
  });

  it('shows the loading indicator while privileges are resolving, without denying access or rendering children', () => {
    mockUseUserPrivilege.mockReturnValue(privilegeState({ isLoading: true }));
    mockHasPrivilege.mockReturnValue(false);

    renderGuard();

    expect(
      screen.getByTestId('admin-privilege-guard-loading-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('protected-content-test-id'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('admin-access-denied-test-id'),
    ).not.toBeInTheDocument();
  });

  it('shows a distinct error state instead of access denied when the privilege fetch fails', () => {
    mockUseUserPrivilege.mockReturnValue(
      privilegeState({ error: new Error('Network error') }),
    );
    mockHasPrivilege.mockReturnValue(false);

    renderGuard();

    expect(
      screen.getByTestId('admin-privilege-check-failed-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('Unable to verify access')).toBeInTheDocument();
    expect(
      screen.getByText('Failed to verify your access, please retry.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('admin-access-denied-test-id'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('protected-content-test-id'),
    ).not.toBeInTheDocument();
  });

  describe('when the user lacks the app:admin privilege', () => {
    beforeEach(() => {
      mockUseUserPrivilege.mockReturnValue(
        privilegeState({
          userPrivileges: [{ uuid: 'priv-1', name: 'app:registration' }],
        }),
      );
      mockHasPrivilege.mockReturnValue(false);
    });

    it('renders the access denied message instead of the children', () => {
      renderGuard();

      expect(
        screen.getByTestId('admin-access-denied-test-id'),
      ).toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
      expect(
        screen.getByText(/You do not have permission to access the Admin/),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('protected-content-test-id'),
      ).not.toBeInTheDocument();
    });

    it('announces the denial to assistive technology', () => {
      renderGuard();

      expect(screen.getByRole('alert')).toHaveAttribute(
        'data-testid',
        'admin-access-denied-test-id',
      );
    });

    // The denial renders in place rather than redirecting, so the header has
    // to stay mounted — the Home breadcrumb is the user's way back out.
    it('keeps the header and Home breadcrumb available as the route back', () => {
      renderGuard();

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
        'href',
        '/bahmni-v2/home',
      );
    });

    describe('Accessibility', () => {
      it('has no accessibility violations', async () => {
        const { container } = renderGuard();
        expect(await axe(container)).toHaveNoViolations();
      });
    });
  });
});
