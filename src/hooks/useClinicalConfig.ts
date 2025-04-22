import { useContext } from 'react';
import { ClinicalConfigContext } from '@contexts/ClinicalConfigContext';
import { ClinicalConfigContextType } from '@types/config';

/**
 * Custom hook to access the config context
 * @returns The config context values including config, loading state, and error
 */
export const useClinicalConfig = (): ClinicalConfigContextType => {
  const context = useContext(ClinicalConfigContext);

  if (!context) {
    throw new Error(
      'useClinicalConfig must be used within a ClinicalConfigProvider',
    );
  }

  return context;
};
