import { createContext } from 'react';
import { RegistrationConfigContextType } from '../models/registrationConfig';

export const RegistrationConfigContext = createContext<
  RegistrationConfigContextType | undefined
>(undefined);
