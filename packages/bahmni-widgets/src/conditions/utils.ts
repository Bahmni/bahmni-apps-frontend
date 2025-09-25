import { Condition } from 'fhir/r4';
import { ConditionViewModel, ConditionStatus } from './models';

// Constants for better maintainability
const ACTIVE_STATUS = 'active';
const INACTIVE_STATUS = 'inactive';

/**
 * Validates that a FHIR Condition resource has all required fields for table display.
 * @param condition - The FHIR Condition resource to validate
 * @returns `true` if the condition has all required fields, `false` otherwise
 */
const isValidFhirCondition = (condition: Condition): boolean => {
  return !!(condition.id && condition.code && condition.recordedDate);
};

/**
 * Maps a FHIR clinical status code to the application's ConditionStatus enum.
 * @param condition - The FHIR Condition resource containing clinical status
 * @returns The corresponding ConditionStatus enum value
 */
const mapFhirStatusToEnum = (condition: Condition): ConditionStatus => {
  const code = condition.clinicalStatus?.coding?.[0]?.code;
  switch (code) {
    case ACTIVE_STATUS:
      return ConditionStatus.Active;
    case INACTIVE_STATUS:
      return ConditionStatus.Inactive;
    default:
      return ConditionStatus.Inactive;
  }
};

/**
 * Transforms an array of FHIR Condition resources into conditions table view models.
 * @param conditions - Array of FHIR Condition resources to transform
 * @returns Array of ConditionViewModel view models ready for table rendering
 * @throws {Error} When a condition is missing required fields (id, code, recordedDate)
 * @throws {Error} When a condition lacks coding information in the code field
 */
export function createConditionViewModels(
  conditions: Condition[],
): ConditionViewModel[] {
  return conditions.map((condition) => {
    if (!isValidFhirCondition(condition)) {
      throw new Error(
        'Incomplete condition data: missing required fields (id, code, or recordedDate)',
      );
    }

    const status = mapFhirStatusToEnum(condition);
    const coding = condition.code?.coding?.[0];

    if (!coding) {
      throw new Error('Missing required condition coding information');
    }

    return {
      id: condition.id!,
      display: condition.code?.text ?? coding.display ?? '',
      status,
      onsetDate: condition.onsetDateTime,
      recordedDate: condition.recordedDate,
      recorder: condition.recorder?.display,
      code: coding.code ?? '',
      codeDisplay: coding.display ?? '',
      note: condition.note?.map((note) => note.text).filter(Boolean),
    };
  });
}
