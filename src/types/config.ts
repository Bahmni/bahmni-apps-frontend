/**
 * Dashboard configuration interface matching appConfig.schema.json
 * Represents the structure of the main dashboard configuration
 */
export interface AppConfig {
  patientInformation: {
    translationKey: string;
    type: string;
  };
  actions: Array<Record<string, unknown>>;
  dashboards: Array<{
    id: string;
    name: string;
    description: string;
    url: string;
    requiredPrivilege: string;
  }>;
}

/**
 * Configuration context interface
 * Extends ConfigState with loading and error states
 */
export interface ConfigContextType {
  config: Record<string, string> | null;
  setConfig: (config: Record<string, string>) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: Error | null;
  setError: (error: Error | null) => void;
}
