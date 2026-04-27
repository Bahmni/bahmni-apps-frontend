export interface Module {
  id: string;
  extensionPointId: string;
  type: string;
  label: string;
  translationKey?: string;
  url: string;
  order: number;
  icon: string;
  requiredPrivilege?: string;
  exclusiveOnlineModule?: boolean;
  exclusiveOfflineModule?: boolean;
}

const BASE_URL = '/bahmni_config/openmrs/apps';
const EXTENSION_POINT_HOME = 'org.bahmni.home.dashboard';

const toArray = (data: Module[] | Record<string, Module>): Module[] =>
  Array.isArray(data) ? data : Object.values(data);

export const fetchModuleExtensions = async (
  appName: string = 'home',
): Promise<Module[]> => {
  try {
    const baseUrl = `${BASE_URL}/${appName}/v2/extension.json`;
    const baseResponse = await fetch(baseUrl);

    if (!baseResponse.ok) {
      throw new Error(`Failed to load base extensions: ${baseResponse.status}`);
    }

    return toArray(await baseResponse.json());
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching module extensions:', error);
    throw error;
  }
};

export const getExtensionsByPoint = (
  extensions: Module[],
  extensionPointId: string = EXTENSION_POINT_HOME,
  type: string = 'link',
): Module[] => {
  return extensions.filter((ext) => {
    const correctPoint = ext.extensionPointId === extensionPointId;
    const correctType = type === 'all' || ext.type === type;
    return correctPoint && correctType;
  });
};

export const filterByPrivilege = (
  extensions: Module[],
  userPrivileges?: string[],
): Module[] => {
  if (!userPrivileges || userPrivileges.length === 0) {
    return extensions;
  }

  return extensions.filter((ext) => {
    if (!ext.requiredPrivilege) {
      return true;
    }
    return userPrivileges.includes(ext.requiredPrivilege);
  });
};

export const filterByOnlineStatus = (modules: Module[]): Module[] => {
  const isOnline = navigator.onLine;

  return modules.filter((module) => {
    if (module.exclusiveOnlineModule && !isOnline) {
      return false;
    }
    if (module.exclusiveOfflineModule && isOnline) {
      return false;
    }
    return true;
  });
};

export const sortByOrder = (modules: Module[]): Module[] => {
  return [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const getVisibleModules = async (
  extensionPointId: string = EXTENSION_POINT_HOME,
  userPrivileges?: string[],
): Promise<Module[]> => {
  const allExtensions = await fetchModuleExtensions('home');
  const byPoint = getExtensionsByPoint(allExtensions, extensionPointId);
  const byPrivilege = filterByPrivilege(byPoint, userPrivileges);
  const byStatus = filterByOnlineStatus(byPrivilege);
  return sortByOrder(byStatus);
};
