import { createConfigHook } from '@bahmni/widgets';
import { RegistrationConfigContext } from './context';
import { RegistrationConfigContextType } from './models';

export const useRegistrationConfig =
  createConfigHook<RegistrationConfigContextType>(
    RegistrationConfigContext,
    'useRegistrationConfig',
    'RegistrationConfigProvider',
  );
