import { createContext } from 'react';

export interface EpisodeOfCare {
  uuid: string;
  encounterIds: string[];
  visitIds: string[];
}

export interface Visit {
  uuid: string;
  encounterIds: string[];
}

export interface Encounter {
  uuid: string;
}

export interface ClinicalAppsContextType {
  episodeOfCare: EpisodeOfCare[];
  visit: Visit[];
  encounter: Encounter[];
  isLoading: boolean;
  error: Error | null;
}

export const ClinicalAppsContext = createContext<
  ClinicalAppsContextType | undefined
>(undefined);
