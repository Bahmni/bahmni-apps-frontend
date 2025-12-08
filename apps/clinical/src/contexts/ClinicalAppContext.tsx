import { createContext } from 'react';

export interface EpisodeOfCare {
  uuid: string;
  encounterUuids: string[];
  visitUuids: string[];
}

export interface Visit {
  uuid: string;
  encounterUuids: string[];
}

export interface Encounter {
  uuid: string;
}

export interface ClinicalAppContextType {
  episodeOfCare: EpisodeOfCare[];
  visit: Visit[];
  encounter: Encounter[];
  isLoading: boolean;
  error: Error | null;
}

export const ClinicalAppContext = createContext<
  ClinicalAppContextType | undefined
>(undefined);
