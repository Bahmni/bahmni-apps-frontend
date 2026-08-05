import type { Extension } from '@bahmni/services';

export const mockSearchExtension: Extension = {
  id: 'ext-1',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  extensionParams: { searchHandler: 'defaultSearch' },
};

export const mockPrivilegedSearchExtension: Extension = {
  id: 'ext-2',
  extensionPointId: 'org.bahmni.clinical.v2.search',
  translationKey: 'ACTIVE_PATIENTS_SEARCH_LABEL',
  requiredPrivileges: ['app:clinical'],
  extensionParams: { searchHandler: 'defaultSearch' },
};

export const mockOtherExtension: Extension = {
  id: 'ext-3',
  extensionPointId: 'org.bahmni.clinical.v2.other',
  translationKey: 'OTHER_LABEL',
};
