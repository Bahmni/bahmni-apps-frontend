import { logout } from '@bahmni/services';
import { logoutAction } from '..';

jest.mock('@bahmni/services');

describe('logout', () => {
  it('should have the required details', () => {
    expect(logoutAction.id).toBe('user-logout-global-action');
    expect(logoutAction.label).toBe('USER_LOGOUT_GLOBAL_ACTION');
    expect(logoutAction.priority).toBe(9999);
    logoutAction.onClick();
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
