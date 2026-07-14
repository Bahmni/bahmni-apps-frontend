import { logout, getFormattedError } from '@bahmni/services';
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
  getFormattedError: jest.fn(),
}));

jest.mock('@carbon/react', () => ({
  HeaderGlobalAction: ({ children, onClick, isActive, ...props }: any) => (
    <button onClick={onClick} data-active={isActive} {...props}>
      {children}
    </button>
  ),
  Menu: ({ children, open }: any) =>
    open ? <div data-testid="menu-content">{children}</div> : null,
  MenuItem: ({ label, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {label}
    </button>
  ),
  MenuItemDivider: () => <hr data-testid="menu-divider" />,
}));

jest.mock('@carbon/icons-react', () => ({
  UserAvatar: () => <svg data-testid="user-avatar-icon" />,
}));

const mockUseActivePractitioner = useActivePractitioner as jest.MockedFunction<
  typeof useActivePractitioner
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockLogout = logout as jest.MockedFunction<typeof logout>;
const mockGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

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

    mockGetFormattedError.mockReturnValue({
      title: 'Error',
      message: 'Something went wrong',
    });

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

  it('renders change password option', async () => {
    const user = userEvent.setup();
    render(<UserProfileMenu />);

    await user.click(screen.getByTestId('user-profile-menu'));

    expect(screen.getByTestId('change-password-option')).toHaveTextContent(
      'Change Password',
    );
  });

  it('renders logout option', async () => {
    const user = userEvent.setup();
    render(<UserProfileMenu />);

    await user.click(screen.getByTestId('user-profile-menu'));

    expect(screen.getByTestId('logout-option')).toHaveTextContent('Logout');
  });

  it('renders menu divider', async () => {
    const user = userEvent.setup();
    render(<UserProfileMenu />);

    await user.click(screen.getByTestId('user-profile-menu'));

    expect(screen.getByTestId('menu-divider')).toBeInTheDocument();
  });

  it('toggles the menu open state when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<UserProfileMenu />);

    const trigger = screen.getByTestId('user-profile-menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('menu-content')).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('menu-content')).toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('menu-content')).not.toBeInTheDocument();
  });

  it('redirects to old app change password page on click', async () => {
    const user = userEvent.setup();
    render(<UserProfileMenu />);

    await user.click(screen.getByTestId('user-profile-menu'));
    const changePasswordBtn = screen.getByTestId('change-password-option');
    await user.click(changePasswordBtn);

    expect(window.location.href).toBe(
      '/bahmni/home/index.html#/changePassword',
    );
  });

  it('calls logout and redirects on logout click', async () => {
    mockLogout.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<UserProfileMenu />);

    await user.click(screen.getByTestId('user-profile-menu'));
    const logoutBtn = screen.getByTestId('logout-option');
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    expect(window.location.href).toBe('/bahmni/home/index.html#/login');
  });

  it('disables logout button while logging out', async () => {
    mockLogout.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    const user = userEvent.setup();

    render(<UserProfileMenu />);

    await user.click(screen.getByTestId('user-profile-menu'));
    const logoutBtn = screen.getByTestId('logout-option');
    await user.click(logoutBtn);

    expect(logoutBtn).toBeDisabled();
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

    await user.click(screen.getByTestId('user-profile-menu'));
    const logoutBtn = screen.getByTestId('logout-option');
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      title: 'Error',
      message: 'Failed to logout. Please try again.',
      type: 'error',
    });
    expect(logoutBtn).not.toBeDisabled();
    consoleErrorSpy.mockRestore();
  });

  describe('Accessibility', () => {
    it('passes axe accessibility tests in default state', async () => {
      const { container } = render(<UserProfileMenu />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
