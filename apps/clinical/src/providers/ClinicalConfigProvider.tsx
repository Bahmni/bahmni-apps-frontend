import {
  getClinicalConfig,
  notificationService,
  ClinicalConfig,
  getFormattedError,
} from '@bahmni-frontend/bahmni-services';
import React, { ReactNode, useState, useMemo, useEffect } from 'react';
import { ClinicalConfigContext } from '../contexts/ClinicalConfigContext';

interface ClinicalConfigProviderProps {
  children: ReactNode;
}

export const ClinicalConfigProvider: React.FC<ClinicalConfigProviderProps> = ({
  children,
}) => {
  const [clinicalConfig, setClinicalConfig] = useState<ClinicalConfig | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const clinicalConfig: ClinicalConfig | null = await getClinicalConfig();
        setClinicalConfig(clinicalConfig);
      } catch (error) {
        const { title, message } = getFormattedError(error);
        setError(new Error(message));
        notificationService.showError(title, message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const value = useMemo(
    () => ({
      clinicalConfig,
      setClinicalConfig,
      isLoading,
      setIsLoading,
      error,
      setError,
    }),
    [clinicalConfig, isLoading, error],
  );

  return (
    <ClinicalConfigContext.Provider value={value}>
      {children}
    </ClinicalConfigContext.Provider>
  );
};

ClinicalConfigProvider.displayName = 'ClinicalConfigProvider';
