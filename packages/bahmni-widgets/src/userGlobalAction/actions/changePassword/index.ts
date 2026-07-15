import { CHANGE_PASSWORD_PATH } from '../../constants';
import { UserAction } from '../../models';

export const changePasswordAction: UserAction = {
  id: 'user-change-password-global-action',
  label: 'USER_CHANGE_PASSWORD_GLOBAL_ACTION',
  onClick: () => {
    window.location.href = CHANGE_PASSWORD_PATH;
  },
  // Lower than logout's 9999 so Change Password appears above Logout in the menu.
  priority: 100,
};
