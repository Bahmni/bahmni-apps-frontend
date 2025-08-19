import { ClinicalConfig } from '@bahmni-frontend/bahmni-services';

/**
 * Configuration context interface
 * Extends ConfigState with loading and error states
 */
export interface ClinicalConfigContextType {
  clinicalConfig: ClinicalConfig | null;
  setClinicalConfig: (config: ClinicalConfig) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: Error | null;
  setError: (error: Error | null) => void;
}
