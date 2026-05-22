import { CLINICAL_V2_CONFIG_BASE_URL } from '../../../constants/app';
import { DurationUnitOption } from '../../../models/medication';

export const MEDICATIONS_CONFIG_URL =
  CLINICAL_V2_CONFIG_BASE_URL + '/medication.json';

export const MEDICATIONS_INPUT_CONTROL_KEY = 'medication';
export const VACCINATIONS_INPUT_CONTROL_KEY = 'vaccination';

export const DURATION_UNIT_OPTIONS: DurationUnitOption[] = [
  {
    code: 'min',
    display: 'DURATION_UNIT_MINUTES',
    daysMultiplier: 1 / (24 * 60),
  },
  { code: 'h', display: 'DURATION_UNIT_HOURS', daysMultiplier: 1 / 24 },
  { code: 'd', display: 'DURATION_UNIT_DAYS', daysMultiplier: 1 },
  { code: 'wk', display: 'DURATION_UNIT_WEEKS', daysMultiplier: 7 },
  { code: 'mo', display: 'DURATION_UNIT_MONTHS', daysMultiplier: 30 },
];
