import { CommonSearchWidgetConfig } from '../../models';

export const mockCommonSearchWidgetConfig: CommonSearchWidgetConfig = [
  {
    context: 'patient',
    translationKey: 'PATIENT_SEARCH',
    requiredPrivileges: ['View Patients'],
    locationAware: 'loggedInLocation',
    url: '/openmrs/ws/rest/v1/patient/search',
    pageSize: 20,
    criteria: [
      {
        field: { key: 'patient.name.given' },
        translationKey: 'PATIENT_GIVEN_NAME',
        default: true,
        input: {
          kind: 'text',
          placeholderTranslationKey: 'PATIENT_GIVEN_NAME_PLACEHOLDER',
        },
      },
    ],
  },
];
