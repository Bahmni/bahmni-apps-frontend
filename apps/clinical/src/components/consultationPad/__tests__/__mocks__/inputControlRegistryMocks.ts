import type { ConsultationPad } from '../../../../providers/clinicalConfig/models';

export const mockConsultationPadConfig: ConsultationPad = {
  allergyConceptMap: {
    medicationAllergenUuid: '',
    foodAllergenUuid: '',
    environmentalAllergenUuid: '',
    allergyReactionUuid: '',
  },
  encounterDetails: {
    encounterTypes: [],
    privileges: ['Encounter'],
    attributes: [],
    metadata: {},
  },
  allergies: {
    encounterTypes: ['Consultation'],
    privileges: ['Allergies'],
    attributes: [],
    metadata: {},
  },
  investigations: {
    encounterTypes: ['Consultation'],
    privileges: ['Investigations'],
    attributes: [],
    metadata: {},
  },
  conditionsAndDiagnoses: {
    encounterTypes: ['Consultation'],
    privileges: ['ConditionsAndDiagnoses'],
    attributes: [],
    metadata: {},
  },
  medications: {
    encounterTypes: ['Consultation'],
    privileges: ['Medications'],
    attributes: [],
    metadata: {},
  },
  vaccinations: {
    encounterTypes: ['Consultation'],
    privileges: ['Vaccinations'],
    attributes: [],
    metadata: {},
  },
  immunizationHistory: {
    encounterTypes: ['Immunization'],
    privileges: ['ImmunizationHistory'],
    attributes: [],
    metadata: {
      administeredLocationTag: '',
      routeConceptUuid: '',
      siteConceptUuid: '',
      vaccineConceptSetUuid: '',
    },
  },
  observationForms: {
    encounterTypes: ['Consultation'],
    privileges: ['Observations'],
    attributes: [],
    metadata: {},
  },
};
