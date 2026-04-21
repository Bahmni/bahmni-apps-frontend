import { Condition, Bundle } from 'fhir/r4';
import { get } from '../api';
import {
  PATIENT_CONDITION_RESOURCE_URL,
  PATIENT_CONDITION_PAGE_URL,
} from './constants';

/**
 * Fetches conditions for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Bundle containing conditions
 */
export async function getConditionsBundle(
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
  const bundle = await getConditionsBundle(patientUUID);
  const conditions =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Condition')
      .map((entry) => entry.resource as Condition) ?? [];

  return conditions;
}

export interface ConditionPage {
  conditions: Condition[];
  total: number | undefined;
}

/**
 * Fetches a single page of conditions using offset-based pagination.
 * Uses _getpagesoffset = (page - 1) * count to jump directly to any page.
 * @param patientUUID - The UUID of the patient
 * @param count - Number of items per page (default 10)
 * @param page - 1-based page number (default 1)
 * @returns Promise resolving to a ConditionPage with conditions and total count
 */
export async function getConditionPage(
  patientUUID: string,
  count: number = 10,
  page: number = 1,
): Promise<ConditionPage> {
  const offset = (page - 1) * count;
  const bundle = await get<Bundle>(
    PATIENT_CONDITION_PAGE_URL(patientUUID, count, offset),
  );
  const conditions =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Condition')
      .map((entry) => entry.resource as Condition) ?? [];
  return {
    conditions,
    total: bundle.total,
  };
}
