import { getConfig } from '@bahmni/services';
import { createConfigProvider } from '@bahmni/widgets';
import { REGISTRATION_CONFIG_URL } from './constants';
import { RegistrationConfigContext } from './context';
import { RegistrationConfig, RegistrationConfigContextType } from './models';
import registrationConfigSchema from './schema.json';

export const RegistrationConfigProvider = createConfigProvider<
  RegistrationConfig,
  RegistrationConfigContextType
>({
  context: RegistrationConfigContext,
  queryKey: ['registrationConfig'],
  queryFn: () =>
    getConfig<RegistrationConfig>(
      REGISTRATION_CONFIG_URL,
      registrationConfigSchema,
    ),
  valueMapper: (registrationConfig, isLoading, error) => ({
    registrationConfig,
    isLoading,
    error,
  }),
  id: 'registration-config',
  name: 'Registration Config',
  displayName: 'RegistrationConfigProvider',
});
