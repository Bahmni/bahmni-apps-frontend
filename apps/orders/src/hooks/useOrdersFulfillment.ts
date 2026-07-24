import { useTranslation } from '@bahmni/services';
import { DataTableHeader } from '@carbon/react';
import { useMemo } from 'react';
import { isCustomOrderTab } from '../models/orderFulfillment';
import { useOrdersConfig } from './useOrdersConfig';

interface UseOrdersFulfillmentReturn {
  headers: DataTableHeader[];
  isLoading: boolean;
  error: Error | null;
  isCustomOrderTab: boolean;
}

export const useOrdersFulfillment = (
  view?: string,
): UseOrdersFulfillmentReturn => {
  const { t } = useTranslation();
  const { ordersTableColumnHeadersGeneric, ordersTableColumnHeadersCustom } =
    useOrdersConfig();

  const isCustomTab = isCustomOrderTab(view);

  const headers = useMemo(() => {
    // Use config from server - drug order config for drug tabs, default config for others
    const columnConfig = isCustomTab
      ? ordersTableColumnHeadersCustom
      : ordersTableColumnHeadersGeneric;

    return columnConfig
      .filter((col) => col.visible)
      .map((col) => ({
        key: col.key,
        header: col.translationKey ? t(col.translationKey) : col.header,
        isSortable: col.sortable,
      }));
  }, [
    isCustomTab,
    t,
    ordersTableColumnHeadersGeneric,
    ordersTableColumnHeadersCustom,
  ]);

  return {
    headers,
    isLoading: false,
    error: null,
    isCustomOrderTab: isCustomTab,
  };
};
