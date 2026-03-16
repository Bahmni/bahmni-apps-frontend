import { hasPrivilege } from '@bahmni/services';
import { useUserPrivilege } from './useUserPrivilege';

export const useHasPrivilege = (
  privilege: string | string[] | undefined,
): boolean => {
  const { userPrivileges } = useUserPrivilege();
  return hasPrivilege(userPrivileges, privilege);
};
