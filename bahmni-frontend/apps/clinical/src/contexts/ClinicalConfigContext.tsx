import { createContext } from 'react';
import { ClinicalConfigContextType } from './models';

export const ClinicalConfigContext = createContext<
  ClinicalConfigContextType | undefined
>(undefined);
