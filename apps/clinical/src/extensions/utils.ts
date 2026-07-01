import { hasPrivilege, UserPrivilege } from '@bahmni/services';
import { Extension } from './models';

export const groupExtensionsByPoint = (
  extensions: Extension[],
): Map<string, Extension[]> => {
  const map = new Map<string, Extension[]>();
  for (const ext of extensions) {
    const group = map.get(ext.extensionPointId) ?? [];
    group.push(ext);
    map.set(ext.extensionPointId, group);
  }
  return map;
};

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
