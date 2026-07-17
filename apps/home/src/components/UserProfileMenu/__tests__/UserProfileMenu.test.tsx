import { logout } from '@bahmni/services';
import { useActivePractitioner, useNotification } from '@bahmni/widgets';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { UserProfileMenu } from '../UserProfileMenu';

expect.extend(toHaveNoViolations);

const mockAddNotification = jest.fn();

jest.mock('@bahmni/widgets', () => ({
  useActivePractitioner: jest.fn(),
  useNotification: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  SkeletonPlaceholder: ({ className }: any) => (
    <div data-testid="skeleton-placeholder" className={className} />
  ),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  logout: jest.fn(),
}));

jest.mock('@carbon/react', () => ({
  OverflowMenu: ({
    children,
    className,
    renderIcon: Icon,
    iconDescription,
    ...props
  }: any) => (
    <div className={className} {...props}>
      {Icon && <Icon />}
      <span>{iconDescription}</span>
      <div data-testid="menu-content">{children}</div>
    </div>
  ),
  OverflowMenuItem: ({
    itemText,
    onClick,
    disabled,
    hasDivider,
    ...props
  }: any) => (
    <>
      {hasDivider && <hr data-testid="menu-divider" />}
      <button onClick={onClick} disabled={disabled} {...props}>
        {itemText}
      </button>
    </>
  ),
}));

const mockUseActivePractitioner = useActivePractitioner as jest.MockedFunction<
  typeof useActivePractitioner
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockLogout = logout as jest.MockedFunction<typeof logout>;

describe('UserProfileMenu', () => {
  const mockUser = {
    uuid: 'user-uuid-123',
    display: 'Dr. John Doe',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
    mockUseActivePractitioner.mockReturnValue({
      practitioner: { uuid: 'practitioner-uuid' },
      user: mockUser,
      loading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  it('renders greeting text with user display name', () => {
    render(<UserProfileMenu />);

    expect(screen.getByText('Hi, Dr. John Doe')).toBeInTheDocument();
  });

  it('renders user profile menu trigger', () => {
    render(<UserProfileMenu />);

    expect(screen.getByTestId('user-profile-menu')).toBeInTheDocument();
  });

  it('renders change password option', () => {
    render(<UserProfileMenu />);

    expect(
      screen.getByRole('button', { name: 'Change Password' }),
    ).toBeInTheDocument();
  });

  it('renders logout option', () => {
    render(<UserProfileMenu />);

    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('renders menu divider', () => {
    render(<UserProfileMenu />);

    expect(screen.getByTestId('menu-divider')).toBeInTheDocument();
  });

  it('redirects to old app change password page on click', async () => {
    const user = userEvent.setup();
    render(<UserProfileMenu />);

    const changePasswordBtn = screen.getByRole('button', {
      name: 'Change Password',
    });
    await user.click(changePasswordBtn);

    expect(window.location.href).toBe(
      '/bahmni/home/index.html#/changePassword',
    );
  });

  it('calls logout and redirects on logout click', async () => {
    mockLogout.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<UserProfileMenu />);

    const logoutBtn = screen.getByRole('button', { name: 'Logout' });
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    expect(window.location.href).toBe('/bahmni/home/index.html#/login');
  });

  it('disables logout button while logging out', async () => {
    // Never resolves, so the component stays in the logging-out state for the
    // duration of the assertion (avoids timer-based flakiness).
    mockLogout.mockImplementation(() => new Promise<void>(() => {}));
    const user = userEvent.setup();

    render(<UserProfileMenu />);

    const logoutBtn = screen.getByRole('button', { name: 'Logout' });
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(logoutBtn).toBeDisabled();
    });
  });

  it('renders skeleton while loading', () => {
    mockUseActivePractitioner.mockReturnValue({
      practitioner: null,
      user: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<UserProfileMenu />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-placeholder')).toBeInTheDocument();
  });

  it('returns null when user data is not available', () => {
    mockUseActivePractitioner.mockReturnValue({
      practitioner: null,
      user: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    const { container } = render(<UserProfileMenu />);

    expect(container.firstChild).toBeNull();
  });

  it('handles logout error gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockLogout.mockRejectedValue(new Error('Logout failed'));
    const user = userEvent.setup();

    render(<UserProfileMenu />);

    const logoutBtn = screen.getByRole('button', { name: 'Logout' });
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      title: 'Logout Failed',
      message: 'Logout failed. Please try again.',
      type: 'error',
    });
    expect(logoutBtn).not.toBeDisabled();
    consoleErrorSpy.mockRestore();
  });

  it('shows a network-specific message when logout fails without a response', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockLogout.mockRejectedValue({ isAxiosError: true });
    const user = userEvent.setup();

    render(<UserProfileMenu />);

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Logout Failed',
        message:
          'Unable to connect. Please check your internet connection and try again.',
        type: 'error',
      });
    });

    consoleErrorSpy.mockRestore();
  });

  it('shows a timeout-specific message when the logout request times out', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockLogout.mockRejectedValue({ isAxiosError: true, code: 'ECONNABORTED' });
    const user = userEvent.setup();

    render(<UserProfileMenu />);

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Logout Failed',
        message: 'Logout timed out. Please try again.',
        type: 'error',
      });
    });

    consoleErrorSpy.mockRestore();
  });

  it('shows a generic server message on a 5xx failure without leaking the backend body', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const sqlLeak = 'ORA-00933: SQL command not properly ended';
    mockLogout.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500, data: { error: sqlLeak } },
    });
    const user = userEvent.setup();

    render(<UserProfileMenu />);

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Logout Failed',
        message: 'The server encountered an error. Please try again later.',
        type: 'error',
      });
    });

    // The raw backend body must never reach the user-facing notification.
    expect(mockAddNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining(sqlLeak) }),
    );

    consoleErrorSpy.mockRestore();
  });

  it('allows logout to be retried after a failure', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockLogout
      .mockRejectedValueOnce(new Error('Logout failed'))
      .mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<UserProfileMenu />);

    const logoutBtn = screen.getByRole('button', { name: 'Logout' });

    // First attempt fails — button re-enabled, still on page
    await user.click(logoutBtn);
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalled();
    });
    expect(logoutBtn).not.toBeDisabled();

    // Second attempt succeeds — redirects to login
    await user.click(logoutBtn);
    await waitFor(() => {
      expect(window.location.href).toBe('/bahmni/home/index.html#/login');
    });
    expect(mockLogout).toHaveBeenCalledTimes(2);

    consoleErrorSpy.mockRestore();
  });

  it('redirects to login without notifying when the session has already expired (401)', async () => {
    const expiredError = {
      isAxiosError: true,
      response: { status: 401 },
    };
    mockLogout.mockRejectedValue(expiredError);
    const user = userEvent.setup();

    render(<UserProfileMenu />);

    const logoutBtn = screen.getByRole('button', { name: 'Logout' });
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(window.location.href).toBe('/bahmni/home/index.html#/login');
    });

    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  describe('Accessibility', () => {
    it('passes axe accessibility tests in default state', async () => {
      const { container } = render(<UserProfileMenu />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('passes axe accessibility tests in loading state', async () => {
      mockUseActivePractitioner.mockReturnValue({
        practitioner: null,
        user: null,
        loading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { container } = render(<UserProfileMenu />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('passes axe accessibility tests after a logout failure', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockLogout.mockRejectedValue(new Error('Logout failed'));
      const user = userEvent.setup();

      const { container } = render(<UserProfileMenu />);

      await user.click(screen.getByRole('button', { name: 'Logout' }));
      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalled();
      });

      expect(await axe(container)).toHaveNoViolations();
      consoleErrorSpy.mockRestore();
    });
  });
});
