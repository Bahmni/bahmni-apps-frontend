import { getConfig } from '@bahmni/services';
import { PATIENT_DOCUMENTS_V2_CONFIG_BASE_URL } from '../constants/app';

export const PATIENT_DOCUMENTS_CONFIG_URL =
  PATIENT_DOCUMENTS_V2_CONFIG_BASE_URL + '/app.json';

export interface PatientDocumentsConfig {
  /** Name of the encounter type under which uploaded documents are recorded. */
  documentEncounterTypeName: string;
}

export const patientDocumentsConfigSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Patient Documents App Configuration Schema',
  type: 'object',
  additionalProperties: false,
  properties: {
    documentEncounterTypeName: {
      type: 'string',
      description:
        'Name of the encounter type under which uploaded documents are recorded',
    },
  },
  required: ['documentEncounterTypeName'],
};

export const getPatientDocumentsConfig = () =>
  getConfig<PatientDocumentsConfig>(
    PATIENT_DOCUMENTS_CONFIG_URL,
    patientDocumentsConfigSchema,
  );
