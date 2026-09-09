import { logout } from '@bahmni/services';
import { UserAction } from '../../models';

export const logoutAction: UserAction = {
  id: 'user-logout-global-action',
  label: 'USER_LOGOUT_GLOBAL_ACTION',
  onClick: logout,
  priority: 9999,
};
