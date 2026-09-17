import { Observation, Bundle, Encounter } from 'fhir/r4';
import { get } from '../api';
import {
  FHIR_OBSERVATION_URL,
  FHIR_OBSERVATIONS_BY_ENCOUNTER_URL,
  FHIR_OBSERVATION_LASTN_URL,
} from './constants';

export async function getPatientObservationsBundle(
  patientUuid: string,
  conceptCodes?: string[],
  serviceRequestId?: string,
): Promise<Bundle<Observation>> {
  const url = FHIR_OBSERVATION_URL(patientUuid, conceptCodes, serviceRequestId);
  return await get<Bundle<Observation>>(url);
}

export async function getPatientObservationsWithEncounterBundle(
  patientUuid: string,
  conceptCodes: string[],
  encounterUuids?: string[],
): Promise<Bundle<Observation | Encounter>> {
  const url = FHIR_OBSERVATION_URL(
    patientUuid,
    conceptCodes,
    undefined,
    true,
    encounterUuids,
  );
  return await get<Bundle<Observation | Encounter>>(url);
}

export async function getPatientLatestObservations(
  patientUuid: string,
  conceptCodes: string[],
  encounterUuids?: string[],
  includeEncounter?: boolean,
): Promise<Bundle<Observation | Encounter>> {
  const url = FHIR_OBSERVATION_LASTN_URL(
    patientUuid,
    conceptCodes,
    encounterUuids,
    includeEncounter,
  );

  const result = await get<Bundle<Observation | Encounter>>(url);
  return result;
}

export async function getPatientObservations(
  patientUUID: string,
  conceptCodes?: string[],
  serviceRequestId?: string,
): Promise<Observation[]> {
  const bundle = await getPatientObservationsBundle(
    patientUUID,
    conceptCodes,
    serviceRequestId,
  );
  const observations =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Observation')
      .map((entry) => entry.resource as Observation) ?? [];

  return observations;
}

export async function getObservationsBundleByEncounterUuid(
  encounterUUID: string,
  basedOn?: string,
): Promise<Bundle<Observation>> {
  return await get<Bundle<Observation>>(
    FHIR_OBSERVATIONS_BY_ENCOUNTER_URL(encounterUUID, basedOn),
  );
}
export interface EncounterGroup {
  encounterUuid: string;
  encounterDateTime: number;
  providerName: string;
  observations: Observation[];
}

const extractUuidFromReference = (ref: string): string => {
  return ref.split('/').pop() ?? '';
};

export const groupObservationsByEncounter = (
  observations: Observation[],
  bundle: Bundle<Encounter>,
): EncounterGroup[] => {
  const encounterMap = new Map<string, EncounterGroup>();

  const encounters =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Encounter')
      .map((entry) => entry.resource as Encounter) ?? [];

  const encounterDataMap = new Map<string, Encounter>();
  encounters.forEach((enc) => {
    if (enc.id) {
      encounterDataMap.set(enc.id, enc);
    }
  });

  observations.forEach((obs) => {
    const encounterRef = obs.encounter?.reference;
    if (!encounterRef) return;

    const encounterUuid = extractUuidFromReference(encounterRef);
    const encounterData = encounterDataMap.get(encounterUuid);

    if (!encounterData) return;

    if (!encounterMap.has(encounterUuid)) {
      const encounterDateTime = encounterData.period?.start
        ? new Date(encounterData.period.start).getTime()
        : 0;

      const providerName =
        encounterData.participant?.[0]?.individual?.display ?? 'Unknown';

      encounterMap.set(encounterUuid, {
        encounterUuid,
        encounterDateTime,
        providerName,
        observations: [],
      });
    }

    encounterMap.get(encounterUuid)!.observations.push(obs);
  });

  return Array.from(encounterMap.values()).sort(
    (a, b) => b.encounterDateTime - a.encounterDateTime,
  );
};
