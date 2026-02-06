import { DashboardConfig } from '../models';

// Happy Path Mocks
export const validFullClinicalConfig = {
  patientInformation: {
    displayPatientIdentifiers: true,
    showPatientPhoto: true,
    additionalAttributes: ['caste', 'education', 'occupation'],
  },
  contextInformation: {
    program: {
      fields: ['ID_Number', 'startDate', 'endDate', 'outcome', 'state'],
    },
  },
  actions: [
    {
      name: 'Start Visit',
      url: '/openmrs/ws/rest/v1/visit',
      icon: 'fa fa-stethoscope',
      requiredPrivilege: 'Start Visit',
    },
    {
      name: 'Add Diagnosis',
      url: '/openmrs/ws/rest/v1/diagnosis',
      icon: 'fa fa-heartbeat',
      requiredPrivilege: 'Add Diagnosis',
    },
    {
      name: 'Record Allergy',
      url: '/openmrs/ws/rest/v1/allergy',
      icon: 'fa fa-exclamation-triangle',
      requiredPrivilege: 'Record Allergy',
    },
  ],
  dashboards: [
    {
      name: 'Patient Information',
      url: 'patient-information',
      requiredPrivileges: ['View Patient Information'],
      icon: 'fa fa-user',
      default: true,
    },
    {
      name: 'Conditions',
      url: 'conditions',
      requiredPrivileges: ['View Conditions'],
      icon: 'fa fa-heartbeat',
    },
    {
      name: 'Allergies',
      url: 'allergies',
      requiredPrivileges: ['View Allergies'],
      icon: 'fa fa-exclamation-triangle',
    },
  ],
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      foodAllergenUuid: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      environmentalAllergenUuid: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      allergyReactionUuid: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
  },
};

export const minimalClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [
    {
      name: 'Basic Information',
      url: 'basic-information',
      requiredPrivileges: ['View Patient Dashboard'],
    },
  ],
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      foodAllergenUuid: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      environmentalAllergenUuid: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      allergyReactionUuid: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
  },
};

export const mixedClinicalConfig = {
  patientInformation: {
    displayPatientIdentifiers: true,
  },
  actions: [
    {
      name: 'Start Visit',
      url: '/openmrs/ws/rest/v1/visit',
      requiredPrivilege: 'Start Visit',
    },
  ],
  dashboards: [
    {
      name: 'Required Section',
      url: 'required-section',
      requiredPrivileges: ['View Patient Dashboard'],
    },
    {
      name: 'Optional Section',
      url: 'optional-section',
      requiredPrivileges: ['View Optional Dashboard'],
      icon: 'fa fa-plus',
      default: false,
    },
  ],
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      foodAllergenUuid: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      environmentalAllergenUuid: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      allergyReactionUuid: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
  },
};

// Sad Path Mocks
export const invalidClinicalConfig = {
  // Missing required properties
  patientInformation: {},
  // Missing actions array
  // Missing dashboards array
  otherProperty: 'value',
};

export const emptyResponse = null;

export const malformedJsonResponse = '{invalid-json}';

// Edge Case Mocks
export const largeConfig = {
  patientInformation: {
    displayPatientIdentifiers: true,
    showPatientPhoto: true,
    additionalAttributes: Array(50)
      .fill(0)
      .map((_, i) => `attribute${i}`),
  },
  actions: Array(20)
    .fill(0)
    .map((_, i) => ({
      name: `Action ${i}`,
      url: `/openmrs/ws/rest/v1/action${i}`,
      icon: 'fa fa-cog',
      requiredPrivilege: `Privilege ${i}`,
    })),
  dashboards: generateLargeDashboards(50), // Generates 50 dashboards
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      foodAllergenUuid: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      environmentalAllergenUuid: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      allergyReactionUuid: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
  },
};

export const allOptionalFieldsConfig = {
  patientInformation: {
    displayPatientIdentifiers: true,
    showPatientPhoto: true,
    additionalAttributes: ['caste', 'education', 'occupation'],
    customSections: [
      {
        name: 'Demographics',
        attributes: ['birthdate', 'gender', 'address'],
      },
      {
        name: 'Contact Information',
        attributes: ['phoneNumber', 'email'],
      },
    ],
  },
  actions: [
    {
      name: 'Comprehensive Action',
      url: '/openmrs/ws/rest/v1/comprehensive',
      icon: 'fa fa-th-large',
      requiredPrivilege: 'Comprehensive Privilege',
      order: 1,
      type: 'standard',
      additionalParams: {
        color: 'blue',
        size: 'large',
        showInHeader: true,
      },
    },
  ],
  dashboards: [
    {
      name: 'Comprehensive Dashboard',
      url: 'comprehensive-dashboard',
      requiredPrivileges: ['View Comprehensive Dashboard'],
      icon: 'fa fa-th-large',
      default: true,
      order: 1,
      displayName: 'Comprehensive View',
      description: 'A dashboard with all possible controls and features',
      config: {
        refreshInterval: 60,
        layout: 'grid',
        maxItems: 10,
      },
    },
  ],
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      foodAllergenUuid: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      environmentalAllergenUuid: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      allergyReactionUuid: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
  },
};

// Helper function to generate large config
function generateLargeDashboards(count: number) {
  const dashboards = [];
  const icons = [
    'fa fa-user',
    'fa fa-heartbeat',
    'fa fa-hospital',
    'fa fa-medkit',
  ];

  for (let i = 0; i < count; i++) {
    dashboards.push({
      name: `Dashboard ${i}`,
      url: `dashboard-${i}`,
      requiredPrivileges: [`View Dashboard ${i}`],
      icon: icons[i % icons.length],
      default: i === 0, // First one is default
    });
  }

  return dashboards;
}

// Mock dashboard configs for testing
export const validDashboardConfig: DashboardConfig = {
  sections: [
    {
      id: 'vitals',
      name: 'Vitals',
      icon: 'heartbeat',
      controls: [],
    },
    {
      id: 'medications',
      name: 'Medications',
      icon: 'pills',
      controls: [],
    },
  ],
};

export const validRegistrationConfig = {
  patientSearch: {
    customAttributes: [
      {
        translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_PHONE_NUMBER',
        fields: ['phoneNumber', 'alternatePhoneNumber'],
        columnTranslationKeys: [
          'REGISTRATION_PATIENT_SEARCH_HEADER_PHONE_NUMBER',
          'REGISTRATION_PATIENT_SEARCH_HEADER_ALTERNATE_PHONE_NUMBER',
        ],
        type: 'person',
      },
      {
        translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_EMAIL',
        fields: ['email'],
        columnTranslationKeys: ['REGISTRATION_PATIENT_SEARCH_HEADER_EMAIL'],
        type: 'person',
      },
      {
        translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_VILLAGE',
        fields: ['village'],
        columnTranslationKeys: ['REGISTRATION_PATIENT_SEARCH_HEADER_VILLAGE'],
        type: 'address',
      },
      {
        translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_LOCALITY',
        fields: ['locality'],
        columnTranslationKeys: ['REGISTRATION_PATIENT_SEARCH_HEADER_LOCALITY'],
        type: 'address',
      },
      {
        translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_PROGRAM_NAME',
        fields: ['programName'],
        columnTranslationKeys: [
          'REGISTRATION_PATIENT_SEARCH_HEADER_PROGRAM_NAME',
        ],
        type: 'program',
      },
    ],
  },
};

export const invalidDashboardConfig = {
  sections: [
    {
      id: 'vitals',
      icon: 'heartbeat',
      translationKey: 'DASHBOARD_VITALS_KEY',
      controls: [],
    },
    {
      id: 'medications',
      name: 'Medications',
      icon: 'pills',
      controls: [],
    },
  ],
};
