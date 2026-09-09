import { registerDefaultActions } from '../index';

describe('registerDefaultActions', () => {
  it('should register change password and logout actions', () => {
    const mockRegisterAction = jest.fn();
    const mockRegistry = {
      registerAction: mockRegisterAction,
      unregisterAction: jest.fn(),
      getActions: jest.fn(),
      clear: jest.fn(),
      version: 0,
    };

    registerDefaultActions(mockRegistry);

    expect(mockRegisterAction).toHaveBeenCalledTimes(2);
    expect(mockRegisterAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-change-password-global-action',
        label: 'USER_CHANGE_PASSWORD_GLOBAL_ACTION',
        onClick: expect.any(Function),
      }),
    );
    expect(mockRegisterAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-logout-global-action',
        label: 'USER_LOGOUT_GLOBAL_ACTION',
        onClick: expect.any(Function),
      }),
    );
  });
});
