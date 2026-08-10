import {
  getOrdersConfig,
  getOrdersTableConfig,
  notificationService,
  OrdersConfig,
  OrdersTableConfig,
  getFormattedError,
} from '@bahmni/services';
import React, { ReactNode, useState, useMemo, useEffect } from 'react';
import { OrdersConfigContext } from '../contexts/OrdersConfigContext';
import { transformExtensionConfigToTabs } from '../models/ordersConfig';

interface OrdersConfigProviderProps {
  children: ReactNode;
}
export const OrdersConfigProvider: React.FC<OrdersConfigProviderProps> = ({
  children,
}) => {
  const [ordersConfig, setOrdersConfig] = useState<OrdersConfig | null>(null);
  const [ordersTableConfig, setOrdersTableConfig] =
    useState<OrdersTableConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const [config, tableConfig] = await Promise.all([
          getOrdersConfig(),
          getOrdersTableConfig(),
        ]);
        setOrdersConfig(config);
        setOrdersTableConfig(tableConfig);
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
  const tabs = useMemo(
    () => transformExtensionConfigToTabs(ordersConfig),
    [ordersConfig],
  );
  const defaultColumnConfigs = useMemo(
    () => ordersTableConfig?.ordersTableColumnHeaders ?? [],
    [ordersTableConfig],
  );
  const drugOrderColumnConfigs = useMemo(
    () => ordersTableConfig?.drugTabsColumnHeaders ?? [],
    [ordersTableConfig],
  );
  const value = useMemo(
    () => ({
      ordersConfig,
      setOrdersConfig,
      ordersTableConfig,
      setOrdersTableConfig,
      tabs,
      defaultColumnConfigs,
      drugOrderColumnConfigs,
      isLoading,
      setIsLoading,
      error,
      setError,
    }),
    [
      ordersConfig,
      ordersTableConfig,
      tabs,
      defaultColumnConfigs,
      drugOrderColumnConfigs,
      isLoading,
      error,
    ],
  );
  return (
    <OrdersConfigContext.Provider value={value}>
      {children}
    </OrdersConfigContext.Provider>
  );
};
OrdersConfigProvider.displayName = 'OrdersConfigProvider';
