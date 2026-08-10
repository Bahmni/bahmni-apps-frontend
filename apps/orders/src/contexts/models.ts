import {
  OrdersConfig,
  OrdersTableConfig,
  OrderColumnConfig,
} from '@bahmni/services';
import { OrderTab } from '../models/ordersConfig';
/**
 * Orders configuration context interface
 * Provides orders config, transformed tabs, table column configurations, loading and error states with setters
 */
export interface OrdersConfigContextType {
  ordersConfig: OrdersConfig | null;
  setOrdersConfig: (config: OrdersConfig | null) => void;
  ordersTableConfig: OrdersTableConfig | null;
  setOrdersTableConfig: (config: OrdersTableConfig | null) => void;
  tabs: OrderTab[];
  defaultColumnConfigs: OrderColumnConfig[];
  drugOrderColumnConfigs: OrderColumnConfig[];
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: Error | null;
  setError: (error: Error | null) => void;
}
