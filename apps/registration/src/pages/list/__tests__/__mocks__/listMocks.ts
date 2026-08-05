import type { Extension } from '@bahmni/services';

export const mockSearchExtension: Extension = {
  id: 'ext-1',
  extensionPointId: 'org.bahmni.registration.v2.search',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
};

export const mockPrivilegedSearchExtension: Extension = {
  id: 'ext-2',
  extensionPointId: 'org.bahmni.registration.v2.search',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  requiredPrivileges: ['app:registration'],
};

export const mockOtherExtension: Extension = {
  id: 'ext-3',
  extensionPointId: 'org.bahmni.registration.v2.other',
  translationKey: 'OTHER_LABEL',
};
