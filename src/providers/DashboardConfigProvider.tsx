import React, { ReactNode, useState, useMemo, useEffect } from 'react';
import { DashboardConfigContext } from '@contexts/DashboardConfigContext';
import { DashboardConfig } from '@types/dashboardConfig';
import { getDashboardConfig } from '@services/configService';
import { getFormattedError } from '@utils/common';
import notificationService from '@services/notificationService';

interface DashboardConfigProviderProps {
  dashboardURL: string;
  children: ReactNode;
}

export const DashboardConfigProvider: React.FC<
  DashboardConfigProviderProps
> = ({ dashboardURL, children }) => {
  const [dashboardConfig, setDashboardConfig] =
    useState<DashboardConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const dashboardConfig: DashboardConfig | null =
          await getDashboardConfig(dashboardURL);
        setDashboardConfig(dashboardConfig);
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
      dashboardConfig: dashboardConfig,
      isLoading: isLoading,
      error: error,
    }),
    [dashboardConfig, isLoading, error],
  );

  return (
    <DashboardConfigContext.Provider value={value}>
      {children}
    </DashboardConfigContext.Provider>
  );
};

DashboardConfigProvider.displayName = 'DashboardConfigProvider';
