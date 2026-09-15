import { useEffect } from 'react';
import { initializeAuditListener } from './globalAuditListener';

export const useAuditListenerInitialization = (): void => {
  useEffect(() => {
    return initializeAuditListener();
  }, []);
};
