import { changePasswordAction } from '..';
import { CHANGE_PASSWORD_PATH } from '../../../constants';

describe('changePasswordAction', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: '' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('should have the required details', () => {
    expect(changePasswordAction.id).toBe('user-change-password-global-action');
    expect(changePasswordAction.label).toBe(
      'USER_CHANGE_PASSWORD_GLOBAL_ACTION',
    );
    expect(changePasswordAction.priority).toBe(100);
    expect(changePasswordAction.requiredPrivilege).toBeUndefined();
  });

  it('should redirect to the change password path on click', () => {
    changePasswordAction.onClick();
    expect(window.location.href).toBe(CHANGE_PASSWORD_PATH);
  });
});
