import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { ActivePractitionerContextType } from '../../activePractitioner/ActivePractitionerContext';
import { useActivePractitioner } from '../../activePractitioner/useActivePractitioner';
import { useNotification } from '../../notification/useNotification';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { registerDefaultActions } from '../actions';
import { UserActionProvider } from '../registry/provider';
import { UserGlobalAction } from '../UserGlobalAction';

expect.extend(toHaveNoViolations);

jest.mock('../../userPrivileges/useUserPrivilege');
jest.mock('../../activePractitioner/useActivePractitioner');
jest.mock('../../notification/useNotification');
jest.mock('../actions', () => ({
  registerDefaultActions: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      options?.name ? `${key} ${options.name}` : key,
  }),
}));

const buildActivePractitionerValue = (
  overrides: Partial<ActivePractitionerContextType> = {},
): ActivePractitionerContextType => ({
  practitioner: null,
  user: null,
  loading: false,
  error: null,
  refetch: jest.fn(),
  ...overrides,
});

const mockAddNotification = jest.fn();

const renderWithProviders = (
  activePractitionerValue: ActivePractitionerContextType = buildActivePractitionerValue(),
) => {
  (useActivePractitioner as jest.Mock).mockReturnValue(activePractitionerValue);

  return render(
    <UserActionProvider>
      <UserGlobalAction />
    </UserActionProvider>,
  );
};

describe('UserGlobalAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: [],
    });
    (useActivePractitioner as jest.Mock).mockReturnValue(
      buildActivePractitionerValue(),
    );
    (useNotification as jest.Mock).mockReturnValue({
      notifications: [],
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
  });

  it('should render the grouped trigger with avatar and greeting when a user is available', () => {
    renderWithProviders(
      buildActivePractitionerValue({
        user: { display: 'Jane Doe' } as ActivePractitionerContextType['user'],
      }),
    );

    expect(
      screen.getByTestId('user-global-action-test-id'),
    ).toBeInTheDocument();
    const button = screen.getByTestId('user-global-action-button-test-id');
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId('user-icon-button-test-id')).toBeInTheDocument();
    expect(
      screen.getByText('USER_GLOBAL_ACTION_GREETING Jane'),
    ).toBeInTheDocument();
  });

  it('should greet with only the first name when the display name has multiple words', () => {
    renderWithProviders(
      buildActivePractitionerValue({
        user: {
          display: 'Jane Elizabeth Doe',
        } as ActivePractitionerContextType['user'],
      }),
    );

    expect(
      screen.getByText('USER_GLOBAL_ACTION_GREETING Jane'),
    ).toBeInTheDocument();
  });

  it('should render a skeleton while the active practitioner is loading', () => {
    renderWithProviders(buildActivePractitionerValue({ loading: true }));

    expect(
      screen.getByTestId('user-global-action-skeleton-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('user-global-action-button-test-id'),
    ).not.toBeInTheDocument();
    // Loading state is announced to screen readers.
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should always render the avatar trigger without crashing when there is no user', () => {
    renderWithProviders(buildActivePractitionerValue({ user: null }));

    const button = screen.getByTestId('user-global-action-button-test-id');
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId('user-icon-button-test-id')).toBeInTheDocument();
    expect(
      screen.queryByText('USER_GLOBAL_ACTION_GREETING'),
    ).not.toBeInTheDocument();
  });

  it('should open menu when trigger is clicked', async () => {
    renderWithProviders(buildActivePractitionerValue());
    const button = screen.getByTestId('user-global-action-button-test-id');

    await userEvent.click(button);

    await waitFor(() => {
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
    });
  });

  it('should close menu when onClose is triggered', async () => {
    renderWithProviders(buildActivePractitionerValue());
    const button = screen.getByTestId('user-global-action-button-test-id');

    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('should register default actions on mount', () => {
    renderWithProviders(buildActivePractitionerValue());
    expect(registerDefaultActions).toHaveBeenCalledTimes(1);
  });

  describe('Default actions', () => {
    it('should show Change Password above Logout', async () => {
      (registerDefaultActions as jest.Mock).mockImplementation((registry) => {
        registry.registerAction({
          id: 'user-logout-global-action',
          label: 'USER_LOGOUT_GLOBAL_ACTION',
          onClick: jest.fn(),
          priority: 9999,
        });
        registry.registerAction({
          id: 'user-change-password-global-action',
          label: 'USER_CHANGE_PASSWORD_GLOBAL_ACTION',
          onClick: jest.fn(),
          priority: 100,
        });
      });

      renderWithProviders(buildActivePractitionerValue());
      const button = screen.getByTestId('user-global-action-button-test-id');

      await userEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText('USER_CHANGE_PASSWORD_GLOBAL_ACTION'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('USER_LOGOUT_GLOBAL_ACTION'),
        ).toBeInTheDocument();
      });

      const menuItems = screen.getAllByRole('menuitem');
      const labels = menuItems.map((item) => item.textContent);
      const changePasswordIndex = labels.findIndex((label) =>
        label?.includes('USER_CHANGE_PASSWORD_GLOBAL_ACTION'),
      );
      const logoutIndex = labels.findIndex((label) =>
        label?.includes('USER_LOGOUT_GLOBAL_ACTION'),
      );

      expect(changePasswordIndex).toBeGreaterThanOrEqual(0);
      expect(logoutIndex).toBeGreaterThanOrEqual(0);
      expect(changePasswordIndex).toBeLessThan(logoutIndex);
    });

    it('should focus the first menu item when the menu opens so arrow keys navigate', async () => {
      (registerDefaultActions as jest.Mock).mockImplementation((registry) => {
        registry.registerAction({
          id: 'user-change-password-global-action',
          label: 'USER_CHANGE_PASSWORD_GLOBAL_ACTION',
          onClick: jest.fn(),
          priority: 100,
        });
        registry.registerAction({
          id: 'user-logout-global-action',
          label: 'USER_LOGOUT_GLOBAL_ACTION',
          onClick: jest.fn(),
          priority: 9999,
        });
      });

      renderWithProviders(buildActivePractitionerValue());
      await userEvent.click(
        screen.getByTestId('user-global-action-button-test-id'),
      );

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems[0]).toHaveFocus();
      });
    });
  });

  const registerChangePasswordAndLogout = () => {
    (registerDefaultActions as jest.Mock).mockImplementation((registry) => {
      registry.registerAction({
        id: 'user-change-password-global-action',
        label: 'USER_CHANGE_PASSWORD_GLOBAL_ACTION',
        onClick: jest.fn(),
        priority: 100,
      });
      registry.registerAction({
        id: 'user-logout-global-action',
        label: 'USER_LOGOUT_GLOBAL_ACTION',
        onClick: jest.fn(),
        priority: 9999,
      });
    });
  };

  describe('Keyboard navigation', () => {
    it('should move focus with ArrowDown/ArrowUp and wrap around', async () => {
      registerChangePasswordAndLogout();
      renderWithProviders(buildActivePractitionerValue());
      await userEvent.click(
        screen.getByTestId('user-global-action-button-test-id'),
      );

      const items = await screen.findAllByRole('menuitem');
      await waitFor(() => expect(items[0]).toHaveFocus());

      await userEvent.keyboard('{ArrowDown}');
      expect(items[1]).toHaveFocus();

      // wraps from last item back to the first
      await userEvent.keyboard('{ArrowDown}');
      expect(items[0]).toHaveFocus();

      // wraps from first item back to the last
      await userEvent.keyboard('{ArrowUp}');
      expect(items[1]).toHaveFocus();
    });
  });

  describe('Action execution', () => {
    it('should run the action onClick when a menu item is clicked', async () => {
      const onClick = jest.fn();
      (registerDefaultActions as jest.Mock).mockImplementation((registry) => {
        registry.registerAction({
          id: 'user-logout-global-action',
          label: 'USER_LOGOUT_GLOBAL_ACTION',
          onClick,
        });
      });

      renderWithProviders(buildActivePractitionerValue());
      await userEvent.click(
        screen.getByTestId('user-global-action-button-test-id'),
      );
      await userEvent.click(
        await screen.findByText('USER_LOGOUT_GLOBAL_ACTION'),
      );

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should show an error notification and log when an action fails', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (registerDefaultActions as jest.Mock).mockImplementation((registry) => {
        registry.registerAction({
          id: 'user-logout-global-action',
          label: 'USER_LOGOUT_GLOBAL_ACTION',
          onClick: jest.fn().mockRejectedValue(new Error('logout failed')),
        });
      });

      renderWithProviders(buildActivePractitionerValue());

      await userEvent.click(
        screen.getByTestId('user-global-action-button-test-id'),
      );
      await userEvent.click(
        await screen.findByText('USER_LOGOUT_GLOBAL_ACTION'),
      );

      await waitFor(() =>
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error' }),
        ),
      );
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Action Filtering', () => {
    it.each([
      {
        description: 'should show actions without required privileges',
        userPrivileges: [],
        mockActions: [
          {
            id: 'action-without-privilege',
            label: 'ACTION_WITHOUT_PRIVILEGE',
            onClick: jest.fn(),
          },
          {
            id: 'action-with-privilege',
            label: 'ACTION_WITH_PRIVILEGE',
            onClick: jest.fn(),
            requiredPrivilege: ['Required Privilege'],
          },
        ],
        expectedVisibleActions: ['ACTION_WITHOUT_PRIVILEGE'],
        expectedHiddenActions: ['ACTION_WITH_PRIVILEGE'],
      },
      {
        description: 'should hide actions when user lacks required privilege',
        userPrivileges: [{ uuid: 'priv-1', name: 'Some Other Privilege' }],
        mockActions: [
          {
            id: 'action-without-privilege',
            label: 'ACTION_WITHOUT_PRIVILEGE',
            onClick: jest.fn(),
          },
          {
            id: 'action-with-privilege',
            label: 'ACTION_WITH_PRIVILEGE',
            onClick: jest.fn(),
            requiredPrivilege: ['Required Privilege'],
          },
        ],
        expectedVisibleActions: ['ACTION_WITHOUT_PRIVILEGE'],
        expectedHiddenActions: ['ACTION_WITH_PRIVILEGE'],
      },
    ])(
      '$description',
      async ({
        userPrivileges,
        mockActions,
        expectedVisibleActions,
        expectedHiddenActions,
      }) => {
        (useUserPrivilege as jest.Mock).mockReturnValue({ userPrivileges });
        (registerDefaultActions as jest.Mock).mockImplementation((registry) => {
          mockActions.forEach((action) => registry.registerAction(action));
        });

        renderWithProviders(buildActivePractitionerValue());

        const button = screen.getByTestId('user-global-action-button-test-id');

        await userEvent.click(button);

        await waitFor(() => {
          expectedVisibleActions.forEach((label) => {
            expect(screen.getByText(label)).toBeInTheDocument();
          });

          expectedHiddenActions.forEach((label) => {
            expect(screen.queryByText(label)).not.toBeInTheDocument();
          });
        });
      },
    );
  });

  describe('Accessibility', () => {
    it('should pass accessibility tests', async () => {
      const { container } = renderWithProviders(buildActivePractitionerValue());
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in the loading state', async () => {
      const { container } = renderWithProviders(
        buildActivePractitionerValue({ loading: true }),
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have no accessibility violations when the menu is open', async () => {
      registerChangePasswordAndLogout();
      renderWithProviders(buildActivePractitionerValue());
      await userEvent.click(
        screen.getByTestId('user-global-action-button-test-id'),
      );
      await screen.findByRole('menu');

      // The menu is portaled to <body>, so axe the whole document. The page-level
      // `region` (landmark) rule is disabled — it only fires because this widget
      // is rendered in isolation without the app's surrounding header landmark.
      const results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot with avatar and greeting', () => {
      const { container } = renderWithProviders(
        buildActivePractitionerValue({
          user: {
            display: 'Jane Doe',
          } as ActivePractitionerContextType['user'],
        }),
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot in the avatar-only state (no user)', () => {
      const { container } = renderWithProviders(
        buildActivePractitionerValue({ user: null }),
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot in the loading state', () => {
      const { container } = renderWithProviders(
        buildActivePractitionerValue({ loading: true }),
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
