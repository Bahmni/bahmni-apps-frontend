import React, { ReactNode, useState, useMemo, useEffect } from 'react';
import { ConfigContext } from '@contexts/ConfigContext';
import { getConfig } from '@services/configService';
import { DASHBOARD_CONFIG_URL } from '@constants/dashboard';
import { getFormattedError } from '@utils/common';
import notificationService from '@services/notificationService';
import dashboardConfigSchema from '@schemas/appConfig.schema.json';
import { AppConfig } from '@types/config';
import { CONFIG_ERROR_MESSAGES } from '@constants/errors';

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const dashboardConfig: AppConfig | null = await getConfig(
          DASHBOARD_CONFIG_URL,
          dashboardConfigSchema,
        );
        if (
          dashboardConfig &&
          dashboardConfig.dashboards &&
          dashboardConfig.dashboards.length > 0
        ) {
          const configMap: Record<string, string> = {};
          dashboardConfig.dashboards.forEach((dashboard) => {
            const departmentID = dashboard.id;
            const departmentURL = dashboard.url;
            configMap[departmentID] = departmentURL;
          });
          setConfig(configMap);
        } else {
          const error = new Error(CONFIG_ERROR_MESSAGES.NO_DASHBOARDS);
          setError(error);
          const { title, message } = getFormattedError(error);
          notificationService.showError(title, message);
        }
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
      config,
      setConfig,
      isLoading,
      setIsLoading,
      error,
      setError,
    }),
    [config, isLoading, error],
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

ConfigProvider.displayName = 'ConfigProvider';
