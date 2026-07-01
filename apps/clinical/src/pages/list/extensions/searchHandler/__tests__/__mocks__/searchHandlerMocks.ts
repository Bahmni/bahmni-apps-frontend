import type { Extension } from '../../../../../../extensions';

export const mockExtensionWithRegisteredType: Extension = {
  id: 'ext-1',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'commonSearch',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  extensionParams: { searchHandler: 'testWidget' },
};

export const mockExtensionWithIcon: Extension = {
  id: 'ext-2',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'commonSearch',
  translationKey: 'ALL_PATIENTS_SEARCH_LABEL',
  icon: 'fa-user',
  extensionParams: { searchHandler: 'testWidget' },
};

export const mockExtensionWithUnregisteredType: Extension = {
  id: 'ext-3',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'commonSearch',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  extensionParams: { searchHandler: 'unregisteredWidget' },
};

export const mockExtensionWithNoSearchHandler: Extension = {
  id: 'ext-4',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'commonSearch',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
};
