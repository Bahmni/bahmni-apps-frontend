import {
  getDashboardConfig,
  notificationService,
  DashboardConfig,
  getFormattedError,
} from '@bahmni-frontend/bahmni-services';
import { useState, useEffect } from 'react';

interface UseDashboardConfigResult {
  dashboardConfig: DashboardConfig | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch and manage dashboard configuration
 *
 * @param dashboardURL - URL path to fetch the dashboard configuration, or null if not available
 * @returns The dashboard configuration, loading state, and error state
 */
export const useDashboardConfig = (
  dashboardURL: string | null,
): UseDashboardConfigResult => {
  const [dashboardConfig, setDashboardConfig] =
    useState<DashboardConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (dashboardURL === null) {
      setDashboardConfig(null);
      setIsLoading(false);
      setError(null);
      return;
    }

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
