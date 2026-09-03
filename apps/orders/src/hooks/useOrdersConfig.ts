import { useContext } from 'react';
import { OrdersConfigContextType } from '../contexts/models';
import { OrdersConfigContext } from '../contexts/OrdersConfigContext';
/**
 * Custom hook to access the orders config context
 * @returns The orders config context values including config, tabs, loading state, and error
 */
export const useOrdersConfig = (): OrdersConfigContextType => {
  const context = useContext(OrdersConfigContext);
  if (!context) {
    throw new Error(
      'useOrdersConfig must be used within an OrdersConfigProvider',
    );
  }
  return context;
};
