import { Encounter, Bundle } from 'fhir/r4';
import { get, post, put } from '../api';
import {
  FHIR_ENCOUNTER_CLASS_CODE_SYSTEM,
  FHIR_ENCOUNTER_TAG_SYSTEM,
} from '../constants/fhir';
import {
  PATIENT_VISITS_URL,
  PATIENT_ENCOUNTERS_URL,
  ENCOUNTER_TYPE_BY_NAME_URL,
  FHIR_ENCOUNTER_URL,
} from './constants';

export interface BuildEncounterResourceParams {
  type: Encounter['type'];
  partOf: Encounter['partOf'];
  subject: Encounter['subject'];
  locationUuid: string;
  periodStart: string;
  practitionerUUIDs?: string[];
}

/**
 * Builds the canonical FHIR Encounter shape used by both the condition service
 * and the consultation-pad submission path. Centralising the shape here makes
 * `encounterResourceCreator.ts` (apps/clinical) the only other place that
 * constructs an Encounter, and it can be migrated to delegate here once its
 * reference-creator helpers are aligned.
 */
export function buildEncounterResource({
  type,
  partOf,
  subject,
  locationUuid,
  periodStart,
  practitionerUUIDs,
}: BuildEncounterResourceParams): Encounter {
  return {
    resourceType: 'Encounter',
    status: 'in-progress',
    class: {
      system: FHIR_ENCOUNTER_CLASS_CODE_SYSTEM,
      code: 'AMB',
      display: 'ambulatory',
    },
    meta: {
      tag: [
        {
          system: FHIR_ENCOUNTER_TAG_SYSTEM,
          code: 'encounter',
          display: 'Encounter',
        },
      ],
    },
    type,
    subject,
    partOf,
    participant: practitionerUUIDs?.length
      ? practitionerUUIDs.map((uuid) => ({
          individual: {
            reference: `Practitioner/${uuid}`,
            type: 'Practitioner' as const,
          },
        }))
      : undefined,
    location: [
      {
        location: {
          reference: `Location/${locationUuid}`,
          type: 'Location' as const,
        },
      },
    ],
    period: { start: periodStart },
  };
}

export interface EncounterTypeRef {
  uuid: string;
  name: string;
}

/**
 * Fetches visits for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a FhirEncounterBundle
 */
export async function getPatientVisits(
  patientUUID: string,
): Promise<Bundle<Encounter>> {
  return await get<Bundle<Encounter>>(PATIENT_VISITS_URL(patientUUID));
}

/**
 * Fetches and transforms visits for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FhirEncounter
 */
export async function getVisits(patientUUID: string): Promise<Encounter[]> {
  const fhirEncounterBundle = await getPatientVisits(patientUUID);
  return (
    fhirEncounterBundle.entry
      ?.map((entry) => entry.resource)
      .filter((resource): resource is Encounter => resource !== undefined) ?? []
  );
}

/**
 * Fetches all encounters for a patient (both visits, tagged "visit", and their child encounters,
 * which carry a partOf reference to the visit). Used to group resources under their visit.
 * Walks every page (offset-based) so patients with many encounters are not truncated to the
 * server's default page size.
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FHIR Encounters
 */
export async function getPatientEncounters(
  patientUUID: string,
): Promise<Encounter[]> {
  const pageSize = 100;
  const encounters: Encounter[] = [];
  let offset = 0;

  for (;;) {
    const bundle = await get<Bundle<Encounter>>(
      PATIENT_ENCOUNTERS_URL(patientUUID, pageSize, offset),
    );
    const page = (bundle.entry ?? [])
      .map((entry) => entry.resource)
      .filter((resource): resource is Encounter => resource !== undefined);
    encounters.push(...page);

    if (page.length < pageSize) {
      break;
    }
    offset += pageSize;
  }

  return encounters;
}

/**
 * Resolves an encounter type by its name via the OpenMRS REST API. `q=` is a fuzzy search, so only
 * an exact-name match is returned; null otherwise (a wrong pick would corrupt grouping/creation).
 * @param name - The encounter type name (e.g. "Patient Document")
 */
export async function getEncounterTypeByName(
  name: string,
): Promise<EncounterTypeRef | null> {
  const response = await get<{ results: EncounterTypeRef[] }>(
    ENCOUNTER_TYPE_BY_NAME_URL(name),
  );
  const results = response.results ?? [];
  return results.find((type) => type.name === name) ?? null;
}

/**
 * Gets the active visit for a patient (encounter with no end date)
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to the current FhirEncounter or null if not found
 */
export async function getActiveVisit(
  patientUUID: string,
): Promise<Encounter | null> {
  const encounters = await getVisits(patientUUID);
  return encounters.find((encounter) => !encounter.period?.end) ?? null;
}

/**
 * Fetches a single encounter by its UUID from the FHIR R4 endpoint
 * @param encounterUUID - The UUID of the encounter
 * @param options - Optional Axios request config (e.g. for AbortController signal)
 * @returns Promise resolving to the Encounter resource
 */
export async function getEncounterByUuid(
  encounterUUID: string,
  options?: import('axios').AxiosRequestConfig,
): Promise<Encounter> {
  return await get<Encounter>(
    `/openmrs/ws/fhir2/R4/Encounter/${encounterUUID}`,
    options,
  );
}

/**
 * Creates a new FHIR Encounter resource
 * @param encounter - The FHIR Encounter resource to create
 * @returns Promise resolving to the created FHIR Encounter
 */
export async function createFhirEncounter(
  encounter: Encounter,
): Promise<Encounter> {
  return await post<Encounter>(FHIR_ENCOUNTER_URL, encounter);
}

/**
 * Updates an existing FHIR Encounter resource
 * @param uuid - The UUID of the encounter to update
 * @param encounter - The updated FHIR Encounter resource
 * @returns Promise resolving to the updated FHIR Encounter
 */
export async function updateFhirEncounter(
  uuid: string,
  encounter: Encounter,
): Promise<Encounter> {
  return await put<Encounter>(`${FHIR_ENCOUNTER_URL}/${uuid}`, encounter);
}
