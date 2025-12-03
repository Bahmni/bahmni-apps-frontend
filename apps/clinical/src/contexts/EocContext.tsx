import { createContext } from 'react';

export interface EocContextType {
  eoc: { visitIds: string[]; encounterIds: string[] } | null;
}

export const EocContext = createContext<EocContextType | undefined>(undefined);
