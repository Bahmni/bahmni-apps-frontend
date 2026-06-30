import type { Extension } from '../../../../extensions';

export const mockSearchExtension: Extension = {
  id: 'ext-1',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'commonSearch',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
};

export const mockPrivilegedSearchExtension: Extension = {
  id: 'ext-2',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  type: 'commonSearch',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  requiredPrivileges: ['app:clinical'],
};

export const mockOtherExtension: Extension = {
  id: 'ext-3',
  extensionPointId: 'org.bahmni.clinical.v2.other',
  type: 'otherType',
  translationKey: 'OTHER_LABEL',
};
