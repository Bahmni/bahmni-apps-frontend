import { FormattedDiagnosis } from '@types/diagnosis';
import { getPriorityByOrder } from './common';

/**
 * Priority order for diagnosis certainty levels (case insensitive)
 * Index 0 = highest priority, higher index = lower priority
 * Used for sorting diagnoses by certainty: confirmed → provisional
 */
export const CERTAINTY_PRIORITY_ORDER = ['confirmed', 'provisional'];

/**
 * Maps diagnosis certainty to numeric priority for sorting
 * Uses generic getPriorityByOrder function with CERTAINTY_PRIORITY_ORDER
 * @param certainty - The certainty code of the diagnosis
 * @returns Numeric priority (lower = higher priority)
 */
export const getCertaintyPriority = (certainty: string): number => {
  return getPriorityByOrder(certainty, CERTAINTY_PRIORITY_ORDER);
};

/**
 * Sorts diagnoses by certainty priority: confirmed → provisional
 * Maintains stable sorting (preserves original order for same certainty)
 * @param diagnoses - Array of formatted diagnoses to sort
 * @returns New sorted array (does not mutate original)
 */
export const sortDiagnosesByCertainty = (
  diagnoses: FormattedDiagnosis[],
): FormattedDiagnosis[] => {
  return [...diagnoses].sort((a, b) => {
    return (
      getCertaintyPriority(a.certainty.code!) -
      getCertaintyPriority(b.certainty.code!)
    );
  });
};
