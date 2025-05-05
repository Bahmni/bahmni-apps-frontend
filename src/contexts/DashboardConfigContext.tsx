import { createContext } from 'react';
import { DashboardConfig } from '@types/dashboardConfig';

export const DashboardConfigContext = createContext<
  DashboardConfig | undefined
>(undefined);
