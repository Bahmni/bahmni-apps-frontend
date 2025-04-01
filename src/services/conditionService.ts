import { get } from './api';
import { PATIENT_CONDITION_RESOURCE_URL } from '@constants/app';
import {
  FhirCondition,
  FhirConditionBundle,
  FormattedCondition,
  ConditionStatus,
} from '@types/condition';
import { getFormattedError } from '@utils/common';
import notificationService from './notificationService';

/**
 * Maps a FHIR clinical status code to ConditionStatus enum
 */
const mapConditionStatus = (condition: FhirCondition): ConditionStatus => {
  const code = condition.clinicalStatus?.coding?.[0]?.code;
  switch (code) {
    case 'active':
      return ConditionStatus.Active;
    case 'inactive':
      return ConditionStatus.Inactive;
    default:
      return ConditionStatus.Inactive;
  }
};

// TODO: Add Optional parameters for pagination and filtering
/**
 * Fetches conditions for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a FhirConditionBundle
 */
export async function getPatientConditionsBundle(
  patientUUID: string,
): Promise<FhirConditionBundle> {
  return await get<FhirConditionBundle>(
    `${PATIENT_CONDITION_RESOURCE_URL(patientUUID)}`,
  );
}

export async function getConditions(
  patientUUID: string,
): Promise<FhirCondition[]> {
  try {
    const fhirConditionBundle = await getPatientConditionsBundle(patientUUID);
    return fhirConditionBundle.entry?.map((entry) => entry.resource) || [];
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

/**
 * Formats a FHIR condition into a more user-friendly format
 * @param conditions - The FHIR condition array to format
 * @returns A formatted condition object
 */
export function formatConditions(
  conditions: FhirCondition[],
): FormattedCondition[] {
  try {
    return conditions.map((condition) => {
      const status = mapConditionStatus(condition);
      const coding = condition.code.coding[0];

      return {
        id: condition.id,
        display: condition.code.text,
        status,
        onsetDate: condition.onsetDateTime,
        recordedDate: condition.recordedDate,
        recorder: condition.recorder?.display,
        code: coding.code,
        codeDisplay: coding.display,
        note: condition.note?.map((note) => note.text),
      };
    });
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}
