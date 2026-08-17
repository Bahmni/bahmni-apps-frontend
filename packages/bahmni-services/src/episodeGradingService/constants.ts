import { OPENMRS_REST_V1 } from '../constants/app';

export const EPISODE_GRADING_STATUS_URL = (episodeUuid: string) =>
  `${OPENMRS_REST_V1}/episode/${episodeUuid}/grading-status`;
