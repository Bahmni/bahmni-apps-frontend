export interface OrderStatusOption {
  value: string;
  label: string;
  translationKey: string;
}

export interface TabStatus {
  available: OrderStatusOption[];
  preSelected: OrderStatusOption[];
}

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
 * Represents a single patient detail field configuration
 */
export interface PatientDetailField {
  key: string;
  label: string;
  translationKey: string;
}

/**
 * Represents LMP configuration for displaying days since last menstrual period
 */
export interface LmpConfig {
  lmpDateConcept: string;
  threshold?: number;
  tabLabels?: string[];
}

/**
 * Represents the orders table configuration from app.json
 * Contains table-specific settings like column configurations for default and drug orders
 */
export interface OrdersTableConfig {
  ordersTableColumnHeadersGeneric: OrderColumnConfig[];
  ordersTableColumnHeadersCustom: OrderColumnConfig[];
  manageOrdersPanelPatientDetails?: PatientDetailField[];
  orderStatusesAvailable?: OrderStatusOption[];
  orderStatusesPreSelected?: OrderStatusOption[];
  fulfillmentEncounterTypeUuid?: string;
  lmpConfig?: LmpConfig;
}
