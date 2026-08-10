/**
 * Represents a single column configuration
 */
export interface OrderColumnConfig {
  key: string;
  header: string;
  translationKey: string;
  visible: boolean;
  sortable: boolean;
}

/**
 * Represents the orders table configuration from app.json
 * Contains table-specific settings like column configurations for default and drug orders
 */
export interface OrdersTableConfig {
  ordersTableColumnHeaders: OrderColumnConfig[];
  drugTabsColumnHeaders: OrderColumnConfig[];
}
