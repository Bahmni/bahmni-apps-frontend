import {
  getRegistrationConfig,
  notificationService,
  RegistrationConfig,
  getFormattedError,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { ReactNode, useState, useMemo, useEffect } from 'react';
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

  const {
    data: queryData,
    isLoading: queryIsLoading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ['registrationConfig'],
    queryFn: getRegistrationConfig,
    enabled: !initialConfig,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  // Update registrationConfig when query data changes
  useEffect(() => {
    if (queryData !== undefined && !initialConfig) {
      setRegistrationConfig(queryData);
    }
  }, [queryData, initialConfig]);

  // Show error notifications
  useEffect(() => {
    if (queryError) {
      const { title, message } = getFormattedError(queryError);
      notificationService.showError(title, message);
    }
  }, [queryError]);

  // Derive loading and error states
  const isLoading = initialConfig ? false : queryIsLoading;
  const error = queryError ? new Error(String(queryError)) : null;

  // Maintain compatibility with setIsLoading and setError for context interface
  const setIsLoading = () => {};
  const setError = () => {};

  // Refetch wrapper to maintain async signature
  const refetch = async () => {
    await queryRefetch();
  };

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
