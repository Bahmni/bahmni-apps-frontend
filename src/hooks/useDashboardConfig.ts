import { useState, useEffect } from 'react';
import { DashboardConfig } from '@types/dashboardConfig';
import { DashboardConfigContextType } from '@types/dashboardConfig';
import { getDashboardConfig } from '@services/configService';
import { getFormattedError } from '@utils/common';
import notificationService from '@services/notificationService';

/**
 * Custom hook to fetch and manage dashboard configuration
 *
 * @param dashboardURL - URL path to fetch the dashboard configuration
 * @returns The dashboard configuration, loading state, and error state
 */
export const useDashboardConfig = (
  dashboardURL: string,
): DashboardConfigContextType => {
  const [dashboardConfig, setDashboardConfig] =
    useState<DashboardConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const config: DashboardConfig | null =
          await getDashboardConfig(dashboardURL);
        setDashboardConfig(config);
      } catch (error) {
        const { title, message } = getFormattedError(error);
        setError(new Error(message));
        notificationService.showError(title, message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [dashboardURL]);

  return {
    dashboardConfig,
    isLoading,
    error,
  };
};
