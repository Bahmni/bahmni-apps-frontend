// src/__mocks__/configMocks.ts

// Happy Path Mocks
export const validFullConfig = {
  section: [
    {
      name: 'Patient Information',
      translationKey: 'DASHBOARD_TITLE_PATIENT_INFO_KEY',
      description: 'Displays patient demographics and identifiers',
      icon: 'fa fa-user',
      controls: [
        {
          type: 'patientInformation',
          translationKey: 'DASHBOARD_TITLE_PATIENT_DETAILS_KEY',
        },
      ],
    },
    {
      name: 'Conditions',
      translationKey: 'DASHBOARD_TITLE_CONDITIONS_KEY',
      description: 'Displays patient conditions and diagnoses',
      icon: 'fa fa-heartbeat',
      controls: [
        {
          type: 'diagnosis',
          translationKey: 'DASHBOARD_TITLE_DIAGNOSIS_KEY',
        },
      ],
    },
    {
      name: 'Allergies',
      translationKey: 'DASHBOARD_TITLE_ALLERGIES_KEY',
      description: 'Displays patient allergies',
      icon: 'fa fa-exclamation-triangle',
      controls: [
        {
          type: 'allergies',
          translationKey: 'DASHBOARD_TITLE_ALLERGIES_LIST_KEY',
        },
      ],
    },
  ],
};

export const minimalConfig = {
  section: [
    {
      name: 'Basic Information',
      translationKey: 'DASHBOARD_TITLE_BASIC_KEY',
      description: 'Basic patient information',
      icon: 'fa fa-info',
      controls: [
        {
          type: 'patientInformation',
        },
      ],
    },
  ],
};

export const mixedConfig = {
  section: [
    {
      name: 'Required Section',
      translationKey: 'DASHBOARD_TITLE_REQUIRED_KEY',
      description: 'Section with required fields only',
      icon: 'fa fa-check',
      controls: [
        {
          type: 'patientInformation',
        },
      ],
    },
    {
      name: 'Optional Section',
      translationKey: 'DASHBOARD_TITLE_OPTIONAL_KEY',
      description: 'Section with optional fields',
      icon: 'fa fa-plus',
      controls: [
        {
          type: 'diagnosis',
          translationKey: 'DASHBOARD_TITLE_DIAGNOSIS_OPTIONAL_KEY',
        },
      ],
    },
  ],
};

// Sad Path Mocks
export const invalidConfig = {
  // Missing required section array
  otherProperty: 'value',
};

export const emptyResponse = null;

export const malformedJsonResponse = '{invalid-json}';

// Edge Case Mocks
export const largeConfig = {
  section: generateLargeSections(50), // Generates 50 sections
};

export const allOptionalFieldsConfig = {
  section: [
    {
      name: 'Comprehensive Section',
      translationKey: 'DASHBOARD_TITLE_COMPREHENSIVE_KEY',
      description: 'Section with all possible controls',
      icon: 'fa fa-th-large',
      controls: [
        {
          type: 'patientInformation',
          translationKey: 'DASHBOARD_TITLE_PATIENT_INFO_KEY',
        },
        {
          type: 'allergies',
          translationKey: 'DASHBOARD_TITLE_ALLERGIES_KEY',
        },
        {
          type: 'diagnosis',
          translationKey: 'DASHBOARD_TITLE_DIAGNOSIS_KEY',
        },
        {
          type: 'formsV2React',
          translationKey: 'DASHBOARD_TITLE_FORMS_KEY',
        },
      ],
    },
  ],
};

// Helper function to generate large config
function generateLargeSections(count: number) {
  const sections = [];
  const controlTypes = [
    'patientInformation',
    'allergies',
    'formsV2React',
    'diagnosis',
  ];

  for (let i = 0; i < count; i++) {
    sections.push({
      name: `Section ${i}`,
      translationKey: `DASHBOARD_TITLE_SECTION_${i}_KEY`,
      description: `Description for section ${i}`,
      icon: 'fa fa-folder',
      controls: [
        {
          type: controlTypes[i % controlTypes.length],
          translationKey: `DASHBOARD_TITLE_CONTROL_${i}_KEY`,
        },
      ],
    });
  }

  return sections;
}
