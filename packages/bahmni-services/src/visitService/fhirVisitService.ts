import type { Encounter } from 'fhir/r4';
import { post } from '../api';
import { createFhirEncounterResource } from './constants';

const FHIR_ENCOUNTER_URL = '/openmrs/ws/fhir2/R4/Encounter';

export async function createVisitWithFhirR4(
  patientUuid: string,
  locationUuid: string,
  visitTypeUuid: string,
  episodeUuid?: string,
  endTime?: string,
): Promise<Encounter> {
  const resource = createFhirEncounterResource(
    patientUuid,
    locationUuid,
    visitTypeUuid,
    episodeUuid,
    endTime,
  );
  return post<Encounter>(FHIR_ENCOUNTER_URL, resource);
}
