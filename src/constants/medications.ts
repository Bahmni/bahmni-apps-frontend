import { FrequencyOption, RouteOption, TimingOption, DosageUnitOption, DurationUnitOption } from '../types/medication';

export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { code: 'OD', display: 'FREQUENCY_ONCE_DAILY', timesPerDay: 1 },
  { code: 'BD', display: 'FREQUENCY_TWICE_DAILY', timesPerDay: 2 },
  { code: 'TDS', display: 'FREQUENCY_THREE_TIMES_DAILY', timesPerDay: 3 },
  { code: 'QDS', display: 'FREQUENCY_FOUR_TIMES_DAILY', timesPerDay: 4 },
  { code: 'Q4H', display: 'FREQUENCY_EVERY_4_HOURS', timesPerDay: 6 },
  { code: 'Q6H', display: 'FREQUENCY_EVERY_6_HOURS', timesPerDay: 4 },
  { code: 'Q8H', display: 'FREQUENCY_EVERY_8_HOURS', timesPerDay: 3 },
  { code: 'Q12H', display: 'FREQUENCY_EVERY_12_HOURS', timesPerDay: 2 },
  { code: 'WEEKLY', display: 'FREQUENCY_WEEKLY', timesPerDay: 0.14 },
  { code: 'STAT', display: 'FREQUENCY_STAT', timesPerDay: 1 },
];

export const ROUTE_OPTIONS: RouteOption[] = [
  { code: 'PO', display: 'ROUTE_ORAL' },
  { code: 'IV', display: 'ROUTE_INTRAVENOUS' },
  { code: 'IM', display: 'ROUTE_INTRAMUSCULAR' },
  { code: 'SC', display: 'ROUTE_SUBCUTANEOUS' },
  { code: 'SL', display: 'ROUTE_SUBLINGUAL' },
  { code: 'TOP', display: 'ROUTE_TOPICAL' },
  { code: 'INH', display: 'ROUTE_INHALATION' },
  { code: 'NASAL', display: 'ROUTE_NASAL' },
  { code: 'RECTAL', display: 'ROUTE_RECTAL' },
  { code: 'VAGINAL', display: 'ROUTE_VAGINAL' },
  { code: 'OPHTHALMIC', display: 'ROUTE_OPHTHALMIC' },
  { code: 'OTIC', display: 'ROUTE_OTIC' },
];

export const TIMING_OPTIONS: TimingOption[] = [
  { code: 'AC', display: 'TIMING_BEFORE_MEALS' },
  { code: 'PC', display: 'TIMING_AFTER_MEALS' },
  { code: 'WITH_MEALS', display: 'TIMING_WITH_MEALS' },
  { code: 'EMPTY_STOMACH', display: 'TIMING_EMPTY_STOMACH' },
  { code: 'BEDTIME', display: 'TIMING_BEDTIME' },
  { code: 'MORNING', display: 'TIMING_MORNING' },
  { code: 'EVENING', display: 'TIMING_EVENING' },
  { code: 'AS_NEEDED', display: 'TIMING_AS_NEEDED' },
];

export const DOSAGE_UNIT_OPTIONS: DosageUnitOption[] = [
  { code: 'TAB', display: 'DOSAGE_UNIT_TABLET' },
  { code: 'CAP', display: 'DOSAGE_UNIT_CAPSULE' },
  { code: 'ML', display: 'DOSAGE_UNIT_ML' },
  { code: 'MG', display: 'DOSAGE_UNIT_MG' },
  { code: 'G', display: 'DOSAGE_UNIT_G' },
  { code: 'MCG', display: 'DOSAGE_UNIT_MCG' },
  { code: 'IU', display: 'DOSAGE_UNIT_IU' },
  { code: 'DROP', display: 'DOSAGE_UNIT_DROP' },
  { code: 'TSP', display: 'DOSAGE_UNIT_TEASPOON' },
  { code: 'TBSP', display: 'DOSAGE_UNIT_TABLESPOON' },
  { code: 'PATCH', display: 'DOSAGE_UNIT_PATCH' },
  { code: 'PUFF', display: 'DOSAGE_UNIT_PUFF' },
];

export const DURATION_UNIT_OPTIONS: DurationUnitOption[] = [
  { code: 'DAYS', display: 'DURATION_UNIT_DAYS', daysMultiplier: 1 },
  { code: 'WEEKS', display: 'DURATION_UNIT_WEEKS', daysMultiplier: 7 },
  { code: 'MONTHS', display: 'DURATION_UNIT_MONTHS', daysMultiplier: 30 },
  { code: 'YEARS', display: 'DURATION_UNIT_YEARS', daysMultiplier: 365 },
];

export const DEFAULT_MEDICATION_VALUES = {
  dosage: 1,
  dosageUnit: 'TAB',
  frequency: 'OD',
  route: 'PO',
  duration: 0,
  durationUnit: 'DAYS',
  timing: 'AC',
  isSTAT: false,
  isPRN: false,
};
