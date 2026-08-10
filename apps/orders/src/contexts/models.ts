import { OrdersConfig } from '@bahmni/services';
import { OrderTab } from '../models/ordersConfig';
/**
 * Orders configuration context interface
 * Provides orders config, transformed tabs, loading and error states with setters
 */
export interface OrdersConfigContextType {
  ordersConfig: OrdersConfig | null;
  setOrdersConfig: (config: OrdersConfig | null) => void;
  tabs: OrderTab[];
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: Error | null;
  setError: (error: Error | null) => void;
}
