import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const EOC_ENCOUNTERS_URL = (episodeUuids: string) =>
  OPENMRS_FHIR_R4 +
  `/EpisodeOfCare?_revinclude=Encounter:episode-of-care&_id=${episodeUuids}`;

export const EOC_BY_UUID_URL = (episodeUuid: string) =>
  OPENMRS_FHIR_R4 + `/EpisodeOfCare/${episodeUuid}`;

export const EOC_CANCEL_URL = (episodeUuid: string) =>
  OPENMRS_REST_V1 + `/mihealth/episode/${episodeUuid}/cancel`;
