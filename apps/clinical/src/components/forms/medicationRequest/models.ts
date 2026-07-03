import {
  MEDICATIONS_INPUT_CONTROL_KEY,
  VACCINATIONS_INPUT_CONTROL_KEY,
} from './constants';

export type MedicationRequestStoreKey =
  | typeof MEDICATIONS_INPUT_CONTROL_KEY
  | typeof VACCINATIONS_INPUT_CONTROL_KEY;
