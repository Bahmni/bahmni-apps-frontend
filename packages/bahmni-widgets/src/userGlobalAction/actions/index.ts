import { UserActionContextType } from '../registry/context';
import { logoutAction } from './logout';

export const registerDefaultActions = (
  registry: UserActionContextType,
): void => {
  registry.registerAction(logoutAction);
};
