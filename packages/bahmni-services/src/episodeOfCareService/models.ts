export interface EpisodeOfCareDataType {
  visitUuids: string[];
  encounterUuids: string[];
}

export interface CancelEpisodeOfCareRequest {
  reason: string;
}
