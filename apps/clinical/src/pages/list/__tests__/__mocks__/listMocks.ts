import type { Extension } from '../../../../extensions';

export const mockSearchExtension: Extension = {
  id: 'ext-1',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
};

export const mockPrivilegedSearchExtension: Extension = {
  id: 'ext-2',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  requiredPrivileges: ['app:clinical'],
};

export const mockOtherExtension: Extension = {
  id: 'ext-3',
  extensionPointId: 'org.bahmni.clinical.v2.other',
  translationKey: 'OTHER_LABEL',
};
