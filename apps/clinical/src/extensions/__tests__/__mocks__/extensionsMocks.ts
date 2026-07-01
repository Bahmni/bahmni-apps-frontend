import { UserPrivilege } from '@bahmni/services';
import { Extension } from '../../models';

export const mockExtensionWithPrivilege: Extension = {
  id: 'ext-1',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  extensionParams: { searchHandler: 'handler', configUrl: '/config.json' },
  requiredPrivileges: ['app:clinical'],
};

export const mockExtensionWithMultiplePrivileges: Extension = {
  id: 'ext-2',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  translationKey: 'PENDING_ORDERS_SEARCH_LABEL',
  extensionParams: { searchHandler: 'handler', configUrl: '/config.json' },
  requiredPrivileges: ['app:clinical', 'app:orders'],
};

export const mockExtensionNoPrivileges: Extension = {
  id: 'ext-3',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  translationKey: 'ALL_PATIENTS_SEARCH_LABEL',
  extensionParams: { searchHandler: 'handler', configUrl: '/config.json' },
};

export const mockExtensionWithDifferentPoint: Extension = {
  id: 'ext-4',
  extensionPointId: 'org.bahmni.clinical.v2.other',
  translationKey: 'ALL_PATIENTS_SEARCH_LABEL',
};

export const mockUserPrivileges: UserPrivilege[] = [
  { uuid: 'priv-1', name: 'app:clinical' },
];
