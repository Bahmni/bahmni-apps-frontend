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
import useOrdersStore from '../stores/ordersStore';

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
  const { setTabPractitionerTypeMap } = useOrdersStore();

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
        if (tableConfig?.tabPractitionerTypeMap) {
          setTabPractitionerTypeMap(tableConfig.tabPractitionerTypeMap);
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
  }, [setTabPractitionerTypeMap]);
  const tabs = useMemo(
    () => transformExtensionConfigToTabs(ordersConfig),
    [ordersConfig],
  );
  const hasBeenAdmittedConfig = {
    key: 'hasBeenAdmitted',
    header: '',
    translationKey: '',
    visible: true,
    sortable: false,
  };
  const ordersTableColumnHeadersGeneric = useMemo(() => {
    if (ordersTableConfig?.ordersTableColumnHeadersGeneric) {
      return [
        ...ordersTableConfig.ordersTableColumnHeadersGeneric,
        hasBeenAdmittedConfig,
      ];
    }
    return [];
  }, [ordersTableConfig]);
  const ordersTableColumnHeadersCustom = useMemo(() => {
    if (ordersTableConfig?.ordersTableColumnHeadersCustom) {
      return [
        ...ordersTableConfig.ordersTableColumnHeadersCustom,
        hasBeenAdmittedConfig,
      ];
    }
    return [];
  }, [ordersTableConfig]);
  const value = useMemo(
    () => ({
      ordersConfig,
      setOrdersConfig,
      ordersTableConfig,
      setOrdersTableConfig,
      tabs,
      ordersTableColumnHeadersGeneric,
      ordersTableColumnHeadersCustom,
      isLoading,
      setIsLoading,
      error,
      setError,
    }),
    [
      ordersConfig,
      ordersTableConfig,
      tabs,
      ordersTableColumnHeadersGeneric,
      ordersTableColumnHeadersCustom,
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
