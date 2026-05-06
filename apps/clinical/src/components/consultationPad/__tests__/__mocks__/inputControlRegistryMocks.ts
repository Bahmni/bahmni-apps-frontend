import type { ConsultationPad } from '../../../../providers/clinicalConfig/models';

export const mockConsultationPadConfig: ConsultationPad = {
  allergyConceptMap: {
    medicationAllergenUuid: '',
    foodAllergenUuid: '',
    environmentalAllergenUuid: '',
    allergyReactionUuid: '',
  },
  inputControls: [
    {
      type: 'encounterDetails',
      encounterTypes: [],
      privileges: ['Encounter'],
      attributes: [],
      metadata: {},
    },
    {
      type: 'allergies',
      encounterTypes: ['Consultation'],
      privileges: ['Allergies'],
      attributes: [],
      metadata: {},
    },
    {
      type: 'investigations',
      encounterTypes: ['Consultation'],
      privileges: ['Investigations'],
      attributes: [],
      metadata: {},
    },
    {
      type: 'conditionsAndDiagnoses',
      encounterTypes: ['Consultation'],
      privileges: ['ConditionsAndDiagnoses'],
      attributes: [],
      metadata: {},
    },
    {
      type: 'medications',
      encounterTypes: ['Consultation'],
      privileges: ['Medications'],
      attributes: [],
      metadata: {},
    },
    {
      type: 'vaccinations',
      encounterTypes: ['Consultation'],
      privileges: ['Vaccinations'],
      attributes: [],
      metadata: {},
    },
    {
      type: 'immunizationHistory',
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
    {
      type: 'observationForms',
      encounterTypes: ['Consultation'],
      privileges: ['Observations'],
      attributes: [],
      metadata: {},
    },
  ],
};
