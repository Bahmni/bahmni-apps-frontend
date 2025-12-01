import { useContext } from 'react';
import { RegistrationConfigContext } from '../contexts/RegistrationConfigContext';
import { RegistrationConfigContextType } from '../models/registrationConfig';

export const useRegistrationConfig = (): RegistrationConfigContextType => {
  const context = useContext(RegistrationConfigContext);

  if (!context) {
    throw new Error(
      'useRegistrationConfig must be used within a RegistrationConfigProvider',
    );
  }

  return context;
};
