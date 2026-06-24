import type { PatientFieldsConfig, TriggerConfig } from '@bahmni/widgets';

export const BAHMNI_COMMAND_PALETTE_NAMESPACE = 'command-palette';

export const COMMAND_PALETTE_APP_CONFIG_URL =
  '/bahmni_config/openmrs/apps/command-palette/app.json';
export const EXTENSION_BASE_URL = '/bahmni_config/openmrs/apps';

export const DEFAULT_TRIGGER: TriggerConfig = {
  type: 'combination',
  keys: ['cmd+k', 'ctrl+k'],
};

export const DEFAULT_PATIENT_FIELDS: PatientFieldsConfig = {
  primaryFields: ['name', 'identifier'],
  additionalFields: ['age', 'gender'],
};
