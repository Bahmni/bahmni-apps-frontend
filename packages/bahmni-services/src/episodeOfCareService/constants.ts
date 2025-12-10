import { OPENMRS_FHIR_R4 } from '../constants/app';

export const EOC_ENCOUNTERS_URL = (episodeUuids: string) =>
  OPENMRS_FHIR_R4 +
  `/EpisodeOfCare?_revinclude=Encounter:episode-of-care&_id=${episodeUuids}`;
