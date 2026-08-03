import type { Encounter } from 'fhir/r4';
import { post } from '../api';
import { getActiveVisit } from '../encounterService';
import { getUserLoginLocation } from '../userService';
import { createFhirEncounterResource } from './constants';
import { getVisitLocationUUID } from './visitService';

const FHIR_ENCOUNTER_URL = '/openmrs/ws/fhir2/R4/Encounter';

export async function createVisitWithFhirR4(
  patientUuid: string,
  locationUuid: string,
  visitTypeUuid: string,
  episodeUuid?: string,
): Promise<Encounter> {
  const resource = createFhirEncounterResource(
    patientUuid,
    locationUuid,
    visitTypeUuid,
    episodeUuid,
  );
  return post<Encounter>(FHIR_ENCOUNTER_URL, resource);
}

export async function getActiveVisitAtLoginLocation(
  patientUuid: string,
): Promise<Encounter | null> {
  const loginLocationUuid = getUserLoginLocation().uuid;
  const visitLocationResponse = await getVisitLocationUUID(loginLocationUuid);
  const visitLocationUuid = visitLocationResponse.uuid;

  return getActiveVisit(patientUuid, visitLocationUuid);
}
