import { createContext } from 'react';
import { ClinicalConfigContextType } from '@types/config';

export const ClinicalConfigContext = createContext<
  ClinicalConfigContextType | undefined
>(undefined);
