import { logout, getFormattedError } from '@bahmni/services';
import { useActivePractitioner, useNotification } from '@bahmni/widgets';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfileMenu } from '../UserProfileMenu';

const mockAddNotification = jest.fn();

jest.mock('@bahmni/widgets', () => ({
  useActivePractitioner: jest.fn(),
  useNotification: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  logout: jest.fn(),
  getFormattedError: jest.fn(),
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

  it('renders change password option', () => {
    render(<UserProfileMenu />);

    expect(screen.getByTestId('change-password-option')).toHaveTextContent(
      'Change Password',
    );
  });

  it('renders logout option', () => {
    render(<UserProfileMenu />);

    expect(screen.getByTestId('logout-option')).toHaveTextContent('Logout');
  });

  it('renders menu divider', () => {
    render(<UserProfileMenu />);

    expect(screen.getByTestId('menu-divider')).toBeInTheDocument();
  });

  it('redirects to old app change password page on click', () => {
    render(<UserProfileMenu />);

    const changePasswordBtn = screen.getByTestId('change-password-option');
    fireEvent.click(changePasswordBtn);

    expect(window.location.href).toBe(
      '/bahmni/home/index.html#/changePassword',
    );
  });

  it('calls logout and redirects on logout click', async () => {
    mockLogout.mockResolvedValue(undefined);

    render(<UserProfileMenu />);

    const logoutBtn = screen.getByTestId('logout-option');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    expect(window.location.href).toBe('/bahmni/home/index.html#/login');
  });

  it('disables logout button while logging out', async () => {
    mockLogout.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<UserProfileMenu />);

    const logoutBtn = screen.getByTestId('logout-option');
    fireEvent.click(logoutBtn);

    expect(logoutBtn).toBeDisabled();
  });

  it('shows loading state when user data is loading', () => {
    mockUseActivePractitioner.mockReturnValue({
      practitioner: null,
      user: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<UserProfileMenu />);

    expect(screen.getByText('LOADING')).toBeInTheDocument();
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

    render(<UserProfileMenu />);

    const logoutBtn = screen.getByTestId('logout-option');
    fireEvent.click(logoutBtn);

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
});
