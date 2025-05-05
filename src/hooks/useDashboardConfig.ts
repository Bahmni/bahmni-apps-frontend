import { useContext } from 'react';
import { DashboardConfigContext } from '@contexts/DashboardConfigContext';
import { DashboardConfigContextType } from '@types/dashboardConfig';

/**
 * Custom hook to access the dashboard configuration context
 *
 * @returns The dashboard configuration context value
 * @throws Error if used outside of a DashboardConfigProvider
 */
export const useDashboardConfig = (): DashboardConfigContextType => {
  const context = useContext(DashboardConfigContext);

  if (context === undefined) {
    throw new Error(
      'useDashboardConfig must be used within a DashboardConfigProvider',
    );
  }

  return context;
};
