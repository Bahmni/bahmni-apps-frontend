import { CLINICAL_V2_CONFIG_BASE_URL } from '../constants/app';

export const DASHBOARD_CONFIG_URL = (dashboardURL: string) =>
  `${CLINICAL_V2_CONFIG_BASE_URL}/dashboards/${dashboardURL}`;

export const EPISODE_UUID_SEARCH_PARAMS_KEY = 'episodeUuid';
export const CURRENT_DASHBOARD_SEARCH_PARAMS_KEY = 'currentDashboard';
export const PROGRAM_UUID_SEARCH_PARAMS_KEY = 'programUuid';
