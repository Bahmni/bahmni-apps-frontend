import { Bundle, Task } from 'fhir/r4';
import { get } from '../api';
import { TASKS_URL } from './constants';

/**
 * Fetches tasks for a given patient with optional filters
 * @param patientUuid - The UUID of the patient
 * @param basedOnReference - Optional reference to filter tasks (e.g., "ServiceRequest/uuid")
 * @param encounterUuids - Optional array of encounter UUIDs to filter tasks
 * @returns Promise resolving to a Bundle of Task resources
 */
export async function getTasks(
  patientUuid?: string,
  basedOnReference?: string,
  encounterUuids?: string[],
): Promise<Bundle<Task>> {
  return get<Bundle<Task>>(
    TASKS_URL(patientUuid, basedOnReference, encounterUuids),
  );
}
