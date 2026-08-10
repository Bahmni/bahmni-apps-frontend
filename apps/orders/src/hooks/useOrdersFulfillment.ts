import { useTranslation } from '@bahmni/services';
import { DataTableHeader } from '@carbon/react';
import { useMemo } from 'react';
import { mockDataByTabLabel } from '../__mocks__/ordersMockData';
import { PatientOrderRow, isDrugOrderTab } from '../models/orderFulfillment';
import { useOrdersConfig } from './useOrdersConfig';

interface UseOrdersFulfillmentReturn {
  rows: PatientOrderRow[];
  headers: DataTableHeader[];
  isLoading: boolean;
  error: Error | null;
  isDrugOrderTab: boolean;
}

export const useOrdersFulfillment = (
  tabLabel: string,
): UseOrdersFulfillmentReturn => {
  const { t } = useTranslation();
  const { defaultColumnConfigs, drugOrderColumnConfigs } = useOrdersConfig();

  const isDrugTab = isDrugOrderTab(tabLabel);

  const rows = useMemo(() => {
    return mockDataByTabLabel[tabLabel] ?? [];
  }, [tabLabel]);

  const headers = useMemo(() => {
    // Use config from server - drug order config for drug tabs, default config for others
    const columnConfig = isDrugTab
      ? drugOrderColumnConfigs
      : defaultColumnConfigs;

    return columnConfig
      .filter((col) => col.visible)
      .map((col) => ({
        key: col.key,
        header: col.translationKey ? t(col.translationKey) : col.header,
        isSortable: col.sortable,
      }));
  }, [isDrugTab, t, defaultColumnConfigs, drugOrderColumnConfigs]);

  return {
    rows,
    headers,
    isLoading: false,
    error: null,
    isDrugOrderTab: isDrugTab,
  };
};
