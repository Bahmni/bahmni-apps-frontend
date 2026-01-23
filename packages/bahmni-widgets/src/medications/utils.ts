import { parseISO } from 'date-fns';
import {
  MedicationRequest,
  FormattedMedicationRequest,
} from '../../../bahmni-services/src/medicationRequestService/models';
import { getPriorityByOrder } from '../../../bahmni-services/src/utils';

/**
 * Priority order for medication status levels (case insensitive)
 * Index 0 = highest priority, higher index = lower priority
 * Used for sorting medications by status: active → on-hold → stopped → cancelled → completed →
 * entered-in-error → draft → unknown
 */
export const MEDICATION_STATUS_PRIORITY_ORDER = [
  'active',
  'on-hold',
  'stopped',
  'cancelled',
  'completed',
  'entered-in-error',
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
 * Gets the priority value for medication based only on isImmediate flag.
 * Lower values indicate higher priority.
 *
 * @param medication - The FormattedMedicationRequest object to get priority for.
 * @returns A numeric priority value (0 = immediate medications, 1 = all other medications).
 */
export const getMedicationPriority = (
  medication: FormattedMedicationRequest,
): number => {
  if (medication.isImmediate) return 0; // Immediate medications (STAT)
  return 1; // All other medications (asNeeded, regular, etc.)
};

/**
 * Sorts an array of medication requests by priority based only on isImmediate flag.
 * Priority order: immediate medications → all other medications (asNeeded, regular, etc.).
 * Stable sort ensures original order is preserved within the same priority group.
 *
 * @param medications - The array of FormattedMedicationRequest objects to be sorted.
 * @returns A new sorted array of FormattedMedicationRequest objects.
 */
export const sortMedicationsByPriority = (
  medications: FormattedMedicationRequest[],
): FormattedMedicationRequest[] => {
  return [...medications].sort((a, b) => {
    return getMedicationPriority(a) - getMedicationPriority(b);
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
    instructions,
    additionalInstructions,
    status,
    asNeeded,
    isImmediate,
    note,
  } = medication;

  const dosageParts: string[] = [];

  if (dose) {
    dosageParts.push(`${dose.value} ${dose.unit}`);
  }
  if (frequency) {
    dosageParts.push(frequency);
  }
  if (duration?.durationUnit) {
    dosageParts.push(
      `${duration.duration} ${formatMedicationRequestDate(duration.durationUnit as 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a')}`,
    );
  }

  const dosage = dosageParts.join(' | ');

  const instructionParts: string[] = [];
  if (route) {
    instructionParts.push(route);
  }
  instructionParts.push(instructions);
  if (additionalInstructions) {
    instructionParts.push(additionalInstructions);
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
    note,
  };
}

/**
 * Sorts an array of medication requests by date distance from today using startDate.
 * Orders medications with today's date first, yesterday second, day before third, etc.
 * Invalid dates are placed at the end. Maintains stable sort for medications with the same date.
 *
 * @param medications - The array of FormattedMedicationRequest objects to be sorted.
 * @returns A new sorted array of FormattedMedicationRequest objects.
 */
export const sortMedicationsByDateDistance = (
  medications: FormattedMedicationRequest[],
): FormattedMedicationRequest[] => {
  if (!medications || medications.length === 0) {
    return [];
  }

  return [...medications].sort((a, b) => {
    const aDate = parseISO(a.startDate);
    const bDate = parseISO(b.startDate);
    return bDate.getTime() - aDate.getTime();
  });
};
