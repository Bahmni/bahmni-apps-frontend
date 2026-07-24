import {
  Observation,
  Encounter,
  Bundle,
  BundleEntry,
  FhirResource,
} from 'fhir/r4';
import { get, post, put } from '../api';
import { FHIR_ENCOUNTER_TYPE_CODE_SYSTEM } from '../constants/fhir';
import {
  PATIENT_VISITS_URL,
  PATIENT_ENCOUNTERS_URL,
  ENCOUNTER_TYPE_BY_NAME_URL,
  FHIR_OBSERVATIONS_BY_ENCOUNTER_URL,
  FHIR_ENCOUNTER_URL,
  BAHMNI_ENCOUNTER_URL,
  CONSULTATION_BUNDLE_URL,
} from './constants';
import { FormsEncounter, OrderFulfillmentEncounterParams } from './models';

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
 * Fetch observations by encounter UUID from FHIR API
 * @param encounterUUID - Encounter UUID
 * @returns Promise resolving to FHIR observation bundle
 */
export async function getObservationsBundleByEncounterUuid(
  encounterUUID: string,
): Promise<Bundle<Observation>> {
  return await get<Bundle<Observation>>(
    FHIR_OBSERVATIONS_BY_ENCOUNTER_URL(encounterUUID),
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

/**
 * Creates a FHIR Encounter linked to an existing visit via ConsultationBundle.
 * Used to associate an order fulfillment action with a clinical session.
 *
 * @param params - Patient, visit, practitioner, location, and encounter type details
 * @returns Promise resolving to the created encounter UUID
 */
export async function createOrderFulfillmentEncounter(
  params: OrderFulfillmentEncounterParams,
): Promise<string> {
  const {
    patientUuid,
    visitUuid,
    practitionerUuid,
    locationUuid,
    encounterTypeUuid,
  } = params;

  const encounterResource: Encounter = {
    resourceType: 'Encounter',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory',
    },
    status: 'in-progress',
    meta: {
      tag: [
        {
          system: 'http://fhir.openmrs.org/ext/encounter-tag',
          code: 'encounter',
          display: 'Encounter',
        },
      ],
    },
    type: [
      {
        coding: [
          {
            system: FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
            code: encounterTypeUuid,
          },
        ],
      },
    ],
    subject: { reference: `Patient/${patientUuid}` },
    participant: [
      {
        individual: {
          reference: `Practitioner/${practitionerUuid}`,
          type: 'Practitioner',
        },
      },
    ],
    partOf: { reference: `Encounter/${visitUuid}` },
    location: [{ location: { reference: `Location/${locationUuid}` } }],
    period: { start: new Date(Date.now() - 1000).toISOString() },
  };

  const fullUrl = `urn:uuid:${crypto.randomUUID()}`;
  const bundleEntry: BundleEntry<FhirResource> = {
    fullUrl,
    resource: encounterResource,
    request: { method: 'POST', url: 'Encounter' },
  };

  const consultationBundle = {
    resourceType: 'ConsultationBundle' as const,
    type: 'transaction' as const,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    entry: [bundleEntry],
  };

  const response = await post<Bundle>(
    CONSULTATION_BUNDLE_URL,
    consultationBundle,
  );

  const encounterUuid = (response?.entry?.[0]?.resource as Encounter)?.id;
  if (!encounterUuid) {
    throw new Error(
      'Failed to extract encounter UUID from ConsultationBundle response',
    );
  }
  return encounterUuid;
}
