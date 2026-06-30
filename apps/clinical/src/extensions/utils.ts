import { hasPrivilege, UserPrivilege } from '@bahmni/services';
import { Extension } from './models';

export const filterExtensionsByPrivileges = (
  extensions: Extension[],
  userPrivileges: UserPrivilege[] | null,
): Extension[] =>
  extensions.filter(
    (ext) =>
      !ext.requiredPrivileges ||
      ext.requiredPrivileges.length === 0 ||
      hasPrivilege(userPrivileges, ext.requiredPrivileges),
  );
