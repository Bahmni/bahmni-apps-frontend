import { useMemo } from 'react';
import { getTabCount } from '../__mocks__/ordersMockData';

interface TabConfig {
  id: string;
  label: string;
}

export const useOrdersTabCounts = (
  tabs: TabConfig[],
): Record<string, number> => {
  return useMemo(() => {
    const counts: Record<string, number> = {};
    tabs.forEach((tab) => {
      counts[tab.label] = getTabCount(tab.label);
    });
    return counts;
  }, [tabs]);
};
