import { Condition, Bundle } from 'fhir/r4';
import { PATIENT_CONDITION_RESOURCE_URL } from '@constants/app';
import { FormattedCondition, ConditionStatus } from '@types/condition';
import { get } from './api';

// Constants for better maintainability
const ACTIVE_STATUS = 'active';
const INACTIVE_STATUS = 'inactive';

/**
 * Validates that a condition has all required fields
 * @param condition - The FHIR Condition resource to validate
 * @returns true if valid, false otherwise
 */
const isValidCondition = (condition: Condition): boolean => {
  return !!(condition.id && condition.code && condition.recordedDate);
};

/**
 * Maps a FHIR clinical status code to ConditionStatus enum
 * @param condition - The FHIR Condition resource
 * @returns The corresponding ConditionStatus
 */
const mapConditionStatus = (condition: Condition): ConditionStatus => {
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

// TODO: Add Optional parameters for pagination and filtering
/**
 * Fetches conditions for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Bundle containing conditions
 */
export async function getPatientConditionsBundle(
  patientUUID: string,
): Promise<Bundle> {
  return await get<Bundle>(`${PATIENT_CONDITION_RESOURCE_URL(patientUUID)}`);
}

/**
 * Fetches and extracts conditions for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of conditions
 */
export async function getConditions(patientUUID: string): Promise<Condition[]> {
  const bundle = await getPatientConditionsBundle(patientUUID);

  // Safe filtering and extraction like diagnosesService
  const conditions =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Condition')
      .map((entry) => entry.resource as Condition) || [];

  return conditions;
}

/**
 * Formats FHIR conditions into a more user-friendly format
 * @param conditions - The FHIR condition array to format
 * @returns An array of formatted condition objects
 */
export function formatConditions(
  conditions: Condition[],
): FormattedCondition[] {
  return conditions.map((condition) => {
    if (!isValidCondition(condition)) {
      throw new Error('Incomplete condition data');
    }

    const status = mapConditionStatus(condition);
    const coding = condition.code?.coding?.[0];

    if (!coding) {
      throw new Error('Missing condition coding information');
    }

    return {
      id: condition.id!,
      display: condition.code?.text || coding.display || '',
      status,
      onsetDate: condition.onsetDateTime,
      recordedDate: condition.recordedDate,
      recorder: condition.recorder?.display,
      code: coding.code || '',
      codeDisplay: coding.display || '',
      note: condition.note?.map((note) => note.text).filter(Boolean),
    };
  });
}
