import { useContext } from 'react';
import { RegistrationConfigContext } from '../contexts/RegistrationConfigContext';
import { RegistrationConfigContextType } from '../models/registrationConfig';

/**
 * Custom hook to access the registration config context
 * @returns The registration config context values including config, loading state, error, and refetch
 * @throws Error if used outside RegistrationConfigProvider
 */
export const useRegistrationConfig = (): RegistrationConfigContextType => {
  const context = useContext(RegistrationConfigContext);

  if (!context) {
    throw new Error(
      'useRegistrationConfig must be used within a RegistrationConfigProvider',
    );
  }

  return context;
};
