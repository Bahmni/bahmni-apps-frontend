import {
  getRegistrationConfig,
  notificationService,
  RegistrationConfig,
  getFormattedError,
} from '@bahmni-frontend/bahmni-services';
import React, {
  ReactNode,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import { RegistrationConfigContext } from '../contexts/RegistrationConfigContext';

interface RegistrationConfigProviderProps {
  children: ReactNode;
  initialConfig?: RegistrationConfig | null;
}

export const RegistrationConfigProvider: React.FC<
  RegistrationConfigProviderProps
> = ({ children, initialConfig }) => {
  const [registrationConfig, setRegistrationConfig] =
    useState<RegistrationConfig | null>(initialConfig ?? null);
  const [isLoading, setIsLoading] = useState(!initialConfig);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config: RegistrationConfig | null = await getRegistrationConfig();
      setRegistrationConfig(config);
    } catch (error) {
      const { title, message } = getFormattedError(error);
      const errorObj = new Error(message);
      setError(errorObj);
      notificationService.showError(title, message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    // Only fetch if no initial config provided
    if (!initialConfig) {
      fetchConfig();
    }
  }, [fetchConfig, initialConfig]);

  const value = useMemo(
    () => ({
      registrationConfig,
      setRegistrationConfig,
      isLoading,
      setIsLoading,
      error,
      setError,
      refetch,
    }),
    [registrationConfig, isLoading, error, refetch],
  );

  return (
    <RegistrationConfigContext.Provider value={value}>
      {children}
    </RegistrationConfigContext.Provider>
  );
};

RegistrationConfigProvider.displayName = 'RegistrationConfigProvider';
