import { OrderExtension, TabStatus } from '@bahmni/services';
/**
 * Represents a simplified tab structure derived from OrderExtension
 * Used for rendering tabs in the UI
 */
export interface OrderTab {
  id: string;
  label: string;
  display: string;
  translationKey: string;
  order: number;
  searchHandler: string;
  forwardUrl: string;
  targetedTab?: string;
  view?: string;
  tabStatuses?: TabStatus;
}
/**
 * Transforms orders extension configuration to tab array
 * @param config - Orders configuration from bahmni-services
 * @returns Array of order tabs sorted by order property
 */
export enum ORDER_PRIORITY {
  STAT = 'STAT',
  ROUTINE = 'ROUTINE',
  ON_SCHEDULED_DATE = 'ON_SCHEDULED_DATE',
}

export interface OrderItem {
  priority: ORDER_PRIORITY;
  dateTime: number;
  orderUuid: string;
  providerName: string;
  providerComments: string;
  orderName: string;
  taskStatus?: string;
  ownerName?: string;
  ownerUuid?: string;
  notes?: string;
}
export const transformExtensionConfigToTabs = (
  config: Record<string, OrderExtension> | null,
): OrderTab[] => {
  if (!config) return [];
  return Object.values(config)
    .map((ext) => ({
      id: ext.id,
      label: ext.label,
      display: ext.extensionParams.display,
      translationKey: ext.extensionParams.translationKey,
      order: ext.order,
      searchHandler: ext.extensionParams.searchHandler,
      forwardUrl: ext.extensionParams.forwardUrl,
      targetedTab: ext.extensionParams.targetedTab,
      view: ext.extensionParams.view,
      tabStatuses: ext.extensionParams.tabStatuses,
    }))
    .sort((a, b) => a.order - b.order);
};
