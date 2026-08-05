import { registerDefaultActions } from '../index';

describe('registerDefaultActions', () => {
  it('should register logout action', () => {
    const mockRegisterAction = jest.fn();
    const mockRegistry = {
      registerAction: mockRegisterAction,
      unregisterAction: jest.fn(),
      getActions: jest.fn(),
      clear: jest.fn(),
      version: 0,
    };

    registerDefaultActions(mockRegistry);

    expect(mockRegisterAction).toHaveBeenCalledTimes(1);
    expect(mockRegisterAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-logout-global-action',
        label: 'USER_LOGOUT_GLOBAL_ACTION',
        onClick: expect.any(Function),
      }),
    );
  });
});
