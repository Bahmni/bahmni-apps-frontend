import { createContext } from 'react';
import { ClinicalConfigContextType } from '@bahmni-frontend/bahmni-services';

export const ClinicalConfigContext = createContext<
  ClinicalConfigContextType | undefined
>(undefined);
