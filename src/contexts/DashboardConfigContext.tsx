import { createContext } from 'react';
import { DashboardConfigContextType } from '@types/dashboardConfig';

export const DashboardConfigContext = createContext<
  DashboardConfigContextType | undefined
>(undefined);
