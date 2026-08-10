/**
 * Represents the extension parameters for an order type
 */
export interface OrderExtensionParams {
  searchHandler: string;
  display: string;
  translationKey: string;
  forwardUrl: string;
  forwardButtonTitle: string;
  view: string;
  targetedTab?: string;
}

/**
 * Represents a single order extension configuration
 */
export interface OrderExtension {
  id: string;
  extensionPointId: string;
  type: string;
  extensionParams: OrderExtensionParams;
  label: string;
  order: number;
  requiredPrivilege: string;
}

/**
 * Orders extension configuration
 * Maps extension keys to their configuration
 */
export interface OrdersConfig {
  [key: string]: OrderExtension;
}
