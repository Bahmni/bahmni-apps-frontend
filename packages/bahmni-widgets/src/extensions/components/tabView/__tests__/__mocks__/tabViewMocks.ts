import { UserPrivilege } from '@bahmni/services';
import { Extension } from '../../../../models';

export const mockExtensionWithWidget: Extension = {
  id: 'ext-active-patients',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'sqlSearch',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  extensionParams: {
    searchHandler: 'emrapi.sqlSearch.activePatients',
    configUrl: '/config.json',
  },
  requiredPrivileges: ['app:clinical'],
};

export const mockExtensionWithIcon: Extension = {
  id: 'ext-with-icon',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'sqlSearch',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  icon: 'fa-user-check',
  extensionParams: {
    searchHandler: 'emrapi.sqlSearch.activePatients',
    configUrl: '/config.json',
  },
  requiredPrivileges: ['app:clinical'],
};

export const mockExtensionWithoutIcon: Extension = {
  id: 'ext-without-icon',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'sqlSearch',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  extensionParams: {
    searchHandler: 'emrapi.sqlSearch.activePatients',
    configUrl: '/config.json',
  },
  requiredPrivileges: ['app:clinical'],
};

export const mockExtensionNoPrivileges: Extension = {
  id: 'ext-public',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'sqlSearch',
  translationKey: 'ALL_PATIENTS_SEARCH_LABEL',
  extensionParams: {
    searchHandler: 'emrapi.sqlSearch.allPatients',
    configUrl: '/config.json',
  },
};

export const mockExtensionUnregisteredType: Extension = {
  id: 'ext-unregistered',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'unknownType',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  extensionParams: { searchHandler: 'handler', configUrl: '/config.json' },
  requiredPrivileges: ['app:clinical'],
};

export const mockUserPrivileges: UserPrivilege[] = [
  { uuid: 'priv-1', name: 'app:clinical' },
];
