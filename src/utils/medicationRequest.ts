import {
  MedicationRequest,
  FormattedMedicationRequest,
} from '@types/medicationRequest';
import { getPriorityByOrder } from './common';

/**
 * Priority order for medication status levels (case insensitive)
 * Index 0 = highest priority, higher index = lower priority
 * Used for sorting medications by status: active → on-hold → cancelled → completed →
 * entered-in-error → stopped → draft → unknown
 */
export const MEDICATION_STATUS_PRIORITY_ORDER = [
  'active',
  'on-hold',
  'cancelled',
  'completed',
  'entered-in-error',
  'stopped',
  'draft',
  'unknown',
];

/**
 * Maps medication status to numeric priority for sorting.
 * Uses a case-insensitive match against the MEDICATION_STATUS_PRIORITY_ORDER.
 *
 * @param status - The status of the medication (e.g. 'active', 'completed').
 * @returns A numeric priority index for sorting (lower = higher priority).
 */
export const getMedicationStatusPriority = (status: string): number => {
  return getPriorityByOrder(status, MEDICATION_STATUS_PRIORITY_ORDER);
};

/**
 * Sorts an array of medication requests by status priority in the order:
 * active → on-hold → completed → stopped. Stable sort ensures original
 * order is preserved for medications with the same status.
 *
 * @param medications - The array of FormattedMedicationRequest objects to be sorted.
 * @returns A new sorted array of FormattedMedicationRequest objects.
 */
export const sortMedicationsByStatus = (
  medications: FormattedMedicationRequest[],
): FormattedMedicationRequest[] => {
  return [...medications].sort((a, b) => {
    return (
      getMedicationStatusPriority(a.status) -
      getMedicationStatusPriority(b.status)
    );
  });
};

/**
 * Converts a short-form duration unit code into its full string representation.
 *
 * @param medication - The duration unit code ('s', 'min', 'h', 'd', 'wk', 'mo', 'a').
 * @returns The full unit name (e.g. 'days' for 'd', 'weeks' for 'wk').
 */
export function formatMedicationRequestDate(
  medication: 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a',
): string {
  switch (medication) {
    case 's':
      return 'seconds';
    case 'min':
      return 'minutes';
    case 'h':
      return 'hours';
    case 'd':
      return 'days';
    case 'wk':
      return 'weeks';
    case 'mo':
      return 'months';
    case 'a':
      return 'years';
  }
}

/**
 * Converts a MedicationRequest object into a FormattedMedicationRequest object.
 * Handles formatting of dosage, instructions, and date fields.
 *
 * @param medication - The original MedicationRequest object to format.
 * @returns A new FormattedMedicationRequest object with readable, formatted data.
 */
export function formatMedicationRequest(
  medication: MedicationRequest,
): FormattedMedicationRequest {
  const {
    id,
    name,
    dose,
    frequency,
    route,
    duration,
    startDate,
    orderDate,
    orderedBy,
    notes = '',
    status,
    asNeeded,
    isImmediate,
  } = medication;

  const dosageParts: string[] = [];

  if (dose) {
    dosageParts.push(`${dose.value} ${dose.unit}`);
  }
  if (frequency) {
    dosageParts.push(frequency);
  }
  if (duration && duration.durationUnit) {
    dosageParts.push(
      `${duration.duration} ${formatMedicationRequestDate(duration.durationUnit as 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a')}`,
    );
  }

  const dosage = dosageParts.join(' | ');

  const instructionParts: string[] = [];
  if (route) {
    instructionParts.push(route);
  }
  if (notes) {
    instructionParts.push(notes);
  }

  const instruction = instructionParts.join(' | ');
  const quantity = `${medication.quantity.value} ${medication.quantity.unit}`;

  return {
    id,
    name,
    dosage,
    dosageUnit: dose ? dose.unit : '',
    instruction,
    startDate: startDate ?? '',
    orderDate: orderDate ?? '',
    orderedBy,
    quantity,
    status,
    asNeeded,
    isImmediate,
  };
}
