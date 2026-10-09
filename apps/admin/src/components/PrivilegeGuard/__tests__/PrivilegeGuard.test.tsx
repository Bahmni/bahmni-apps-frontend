import { hasPrivilege, useTranslation } from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import enTranslations from '../../../../public/locales/locale_en.json';
import { PrivilegeGuard } from '../PrivilegeGuard';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  hasPrivilege: jest.fn(),
  useTranslation: jest.fn(),
}));

// Looks up the real bundled strings so existing assertions on translated
// text keep working, while still letting tests hand back a `t` with a
// different function identity to simulate a locale switch.
const realT = ((key: string) =>
  (enTranslations as Record<string, string>)[key] ?? key) as ReturnType<
  typeof useTranslation
>['t'];

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
  useNotification: jest.fn(),
  UserGlobalAction: () => <div data-testid="user-global-action-test-id" />,
}));

const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;
const mockHasPrivilege = hasPrivilege as jest.MockedFunction<
  typeof hasPrivilege
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
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
  const addNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotification.mockReturnValue({
      notifications: [],
      addNotification,
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
    mockUseTranslation.mockReturnValue({ t: realT } as ReturnType<
      typeof useTranslation
    >);
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
    expect(addNotification).not.toHaveBeenCalled();
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
    expect(addNotification).not.toHaveBeenCalled();
  });

  it('renders a distinct fallback instead of access denied when the privilege fetch fails, without raising its own toast', () => {
    mockUseUserPrivilege.mockReturnValue(
      privilegeState({ error: new Error('Network error') }),
    );
    mockHasPrivilege.mockReturnValue(false);

    renderGuard();

    const fallback = screen.getByTestId('admin-privilege-check-failed-test-id');
    expect(fallback).toBeInTheDocument();
    // Once the toast is dismissed, this is the only remaining explanation —
    // it needs the full message, not just the title, and a live-region role
    // so assistive tech announces it independently of the toast.
    expect(fallback).toHaveTextContent('Unable to verify access');
    expect(fallback).toHaveTextContent(
      'Failed to verify your access, please retry.',
    );
    expect(fallback).toHaveAttribute('role', 'status');
    expect(fallback).toHaveAttribute('aria-live', 'polite');
    // UserPrivilegeProvider's catch block already raises a toast for this
    // failure, so PrivilegeGuard must not stack a second one on top of it.
    expect(addNotification).not.toHaveBeenCalled();
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

    it('raises an access denied toast instead of rendering the children', () => {
      renderGuard();

      const fallback = screen.getByTestId('admin-access-denied-test-id');
      expect(fallback).toBeInTheDocument();
      expect(addNotification).toHaveBeenCalledWith({
        title: 'Access denied',
        message:
          'You do not have permission to access the Admin module. Please contact your administrator if you believe this is a mistake. [Privileges required: app:admin]',
        type: 'error',
      });
      // Same recoverability guarantee as the fetch-failure fallback: full
      // message plus a live-region role, independent of the toast.
      expect(fallback).toHaveTextContent(
        'You do not have permission to access the Admin module. Please contact your administrator if you believe this is a mistake. [Privileges required: app:admin]',
      );
      expect(fallback).toHaveAttribute('role', 'status');
      expect(fallback).toHaveAttribute('aria-live', 'polite');
      expect(
        screen.queryByTestId('protected-content-test-id'),
      ).not.toBeInTheDocument();
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

    it('does not raise the toast more than once for a stable resolved state', () => {
      const { rerender } = renderGuard();
      rerender(
        <PrivilegeGuard>
          <div data-testid="protected-content-test-id">Protected</div>
        </PrivilegeGuard>,
      );

      expect(addNotification).toHaveBeenCalledTimes(1);
    });

    it('raises the toast again when `t` gets a genuinely new reference (e.g. a locale switch), even though the resolved/denied state itself is unchanged', () => {
      const { rerender } = renderGuard();
      expect(addNotification).toHaveBeenCalledTimes(1);

      // `t` is a dependency of the toast effect. A real locale switch hands
      // back a new `t` function from `useTranslation()` — a fresh reference,
      // not the memoized one from the first render — even though the
      // underlying resolved/denied booleans never change. Reusing the same
      // mock for every render (as the previous test does) can't observe
      // this: it never proves the effect keys off `t`'s identity rather
      // than coincidentally-stable mocks.
      mockUseTranslation.mockReturnValueOnce({
        t: ((key: string) => realT(key)) as ReturnType<
          typeof useTranslation
        >['t'],
      } as ReturnType<typeof useTranslation>);

      rerender(
        <PrivilegeGuard>
          <div data-testid="protected-content-test-id">Protected</div>
        </PrivilegeGuard>,
      );

      expect(addNotification).toHaveBeenCalledTimes(2);
    });

    describe('Accessibility', () => {
      it('has no accessibility violations', async () => {
        const { container } = renderGuard();
        expect(await axe(container)).toHaveNoViolations();
      });
    });
  });
});
