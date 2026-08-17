import { get } from '../api';
import { EPISODE_GRADING_STATUS_URL } from './constants';

export interface EpisodeGradingStatus {
  alreadySubmitted: boolean;
  formUuid: string | null;
}

export async function getEpisodeGradingStatus(
  episodeUuid: string,
): Promise<EpisodeGradingStatus> {
  return await get<EpisodeGradingStatus>(EPISODE_GRADING_STATUS_URL(episodeUuid));
}
