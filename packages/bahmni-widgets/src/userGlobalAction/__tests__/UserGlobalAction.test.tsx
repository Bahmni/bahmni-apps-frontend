import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { registerDefaultActions } from '../actions';
import { UserActionProvider } from '../registry/provider';
import { UserGlobalAction } from '../UserGlobalAction';

expect.extend(toHaveNoViolations);

jest.mock('../../userPrivileges/useUserPrivilege');
jest.mock('../actions', () => ({
  registerDefaultActions: jest.fn(),
}));

describe('UserGlobalAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: [],
    });
  });

  const wrapper = (
    <UserActionProvider>
      <UserGlobalAction />
    </UserActionProvider>
  );

  it('should render the user global action button', () => {
    render(wrapper);
    expect(
      screen.getByTestId('user-global-action-test-id'),
    ).toBeInTheDocument();
    const button = screen.getByRole('button', {
      name: 'USER_GLOBAL_ACTION_BUTTON',
    });
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('should open menu when button is clicked', async () => {
    render(wrapper);
    const button = screen.getByRole('button', {
      name: 'USER_GLOBAL_ACTION_BUTTON',
    });

    await userEvent.click(button);

    await waitFor(() => {
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
    });
  });

  it('should close menu when onClose is triggered', async () => {
    render(wrapper);
    const button = screen.getByRole('button', {
      name: 'USER_GLOBAL_ACTION_BUTTON',
    });

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
    render(wrapper);
    expect(registerDefaultActions).toHaveBeenCalledTimes(1);
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

        const customWrapper = (
          <UserActionProvider>
            <UserGlobalAction />
          </UserActionProvider>
        );

        render(customWrapper);

        const button = screen.getByRole('button', {
          name: 'USER_GLOBAL_ACTION_BUTTON',
        });

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
      const { container } = render(wrapper);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
