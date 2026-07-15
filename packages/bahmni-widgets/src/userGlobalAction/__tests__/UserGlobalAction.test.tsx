import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import {
  ActivePractitionerContext,
  ActivePractitionerContextType,
} from '../../activePractitioner/ActivePractitionerContext';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { registerDefaultActions } from '../actions';
import { UserActionProvider } from '../registry/provider';
import { UserGlobalAction } from '../UserGlobalAction';

expect.extend(toHaveNoViolations);

jest.mock('../../userPrivileges/useUserPrivilege');
jest.mock('../actions', () => ({
  registerDefaultActions: jest.fn(),
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

const renderWithProviders = (
  activePractitionerValue?: ActivePractitionerContextType,
) => {
  const tree = (
    <UserActionProvider>
      <UserGlobalAction />
    </UserActionProvider>
  );

  if (activePractitionerValue === undefined) {
    // Simulates apps that haven't wired an ActivePractitionerProvider.
    return render(tree);
  }

  return render(
    <ActivePractitionerContext.Provider value={activePractitionerValue}>
      {tree}
    </ActivePractitionerContext.Provider>,
  );
};

describe('UserGlobalAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: [],
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
    expect(screen.getByText('USER_GLOBAL_ACTION_GREETING')).toBeInTheDocument();
  });

  it('should render a skeleton while the active practitioner is loading', () => {
    renderWithProviders(buildActivePractitionerValue({ loading: true }));

    expect(
      screen.getByTestId('user-global-action-skeleton-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('user-global-action-button-test-id'),
    ).not.toBeInTheDocument();
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

  it('should still render the avatar trigger without crashing when no ActivePractitionerProvider is present', () => {
    // Regression guard: apps like registration/appointments don't wire
    // ActivePractitionerProvider today. The widget must degrade to avatar-only
    // instead of throwing/disappearing.
    renderWithProviders(undefined);

    const button = screen.getByTestId('user-global-action-button-test-id');
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId('user-icon-button-test-id')).toBeInTheDocument();
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
  });
});
