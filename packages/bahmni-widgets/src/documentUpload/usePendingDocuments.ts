import { useContext } from 'react';
import { PendingDocumentsContextValue } from './models';
import { PendingDocumentsContext } from './PendingDocumentsContext';

export const usePendingDocuments = (): PendingDocumentsContextValue => {
  const context = useContext(PendingDocumentsContext);
  if (!context) {
    throw new Error(
      'usePendingDocuments must be used within a PendingDocumentsProvider',
    );
  }
  return context;
};
