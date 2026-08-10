import { OrderExtension } from '@bahmni/services';
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
}
/**
 * Transforms orders extension configuration to tab array
 * @param config - Orders configuration from bahmni-services
 * @returns Array of order tabs sorted by order property
 */
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
    }))
    .sort((a, b) => a.order - b.order);
};
