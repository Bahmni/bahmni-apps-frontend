import { DashboardConfig } from "@bahmni-frontend/bahmni-services";

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
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      foodAllergenUuid: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      environmentalAllergenUuid: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      allergyReactionUuid: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
  },
};

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