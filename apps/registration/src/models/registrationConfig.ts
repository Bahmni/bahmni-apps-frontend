import { RegistrationConfig } from '@bahmni-frontend/bahmni-services';

/**
 * Registration configuration context interface
 * Provides access to registration config with loading and error states
 */
export interface RegistrationConfigContextType {
  registrationConfig: RegistrationConfig | null;
  setRegistrationConfig: (config: RegistrationConfig | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: Error | null;
  setError: (error: Error | null) => void;
  refetch: () => Promise<void>;
}
