import { createContext } from 'react';
import { PendingDocumentsContextValue } from './models';

export const PendingDocumentsContext = createContext<
  PendingDocumentsContextValue | undefined
>(undefined);
