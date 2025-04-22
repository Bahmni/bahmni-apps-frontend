// src/__mocks__/configMocks.ts

// Happy Path Mocks
export const validFullClinicalConfig = {
  patientInformation: {
    displayPatientIdentifiers: true,
    showPatientPhoto: true,
    additionalAttributes: ['caste', 'education', 'occupation'],
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
