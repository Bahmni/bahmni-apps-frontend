import { UserActionContextType } from '../registry/context';
import { changePasswordAction } from './changePassword';
import { logoutAction } from './logout';

export const registerDefaultActions = (
  registry: UserActionContextType,
): void => {
  registry.registerAction(changePasswordAction);
  registry.registerAction(logoutAction);
};
