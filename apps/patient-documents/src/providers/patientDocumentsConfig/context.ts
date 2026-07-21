import { createContext } from 'react';
import { PatientDocumentsConfigContextType } from './models';

export const PatientDocumentsConfigContext = createContext<
  PatientDocumentsConfigContextType | undefined
>(undefined);
