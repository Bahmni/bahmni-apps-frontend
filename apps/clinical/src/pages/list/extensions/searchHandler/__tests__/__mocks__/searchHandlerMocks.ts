import type { Extension } from '../../../../../../extensions';

export const mockExtensionWithRegisteredType: Extension = {
  id: 'ext-1',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'testWidget',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
};

export const mockExtensionWithIcon: Extension = {
  id: 'ext-2',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'testWidget',
  translationKey: 'ALL_PATIENTS_SEARCH_LABEL',
  icon: 'fa-user',
};

export const mockExtensionWithUnregisteredType: Extension = {
  id: 'ext-3',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'unregisteredType',
  translationKey: 'PENDING_ORDERS_SEARCH_LABEL',
};
