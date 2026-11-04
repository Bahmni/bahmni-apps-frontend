import { OrderStatus } from '../models/orderFulfillment';

/**
 * Maps UI order statuses to FHIR Task status values for saving.
 * If a selected UI status has no entry here, the save is blocked.
 */
export const UI_STATUS_TO_FHIR_TASK_STATUS: Partial<
  Record<OrderStatus, string>
> = {
  New: 'draft',
  Acknowledged: 'requested',
  'In Progress': 'accepted',
  Completed: 'completed',
  'Ready for Pickup': 'ready',
  'On Hold': 'on-hold',
  Cancelled: 'cancelled',
};

/**
 * Maps FHIR Task status values to UI order statuses for display.
 * Null/missing task status values are handled by the caller (default: 'New').
 */
export const FHIR_TASK_STATUS_TO_UI_STATUS: Record<string, OrderStatus> = {
  draft: 'New',
  requested: 'Acknowledged',
  accepted: 'In Progress',
  completed: 'Completed',
  rejected: 'New',
  ready: 'Ready for Pickup',
  'on-hold': 'On Hold',
  cancelled: 'Cancelled',
};

export const UI_STATUS_TO_TRANSLATION_KEY: Record<OrderStatus, string> = {
  New: 'STATUS_NEW',
  Acknowledged: 'STATUS_ACKNOWLEDGED',
  'In Progress': 'STATUS_IN_PROGRESS',
  Completed: 'STATUS_COMPLETED',
  'Ready for Pickup': 'STATUS_READY_FOR_PICKUP',
  'On Hold': 'STATUS_ON_HOLD',
  Cancelled: 'STATUS_CANCELLED',
};

/**
 * Default status pre-populated in the slider when a 'New' order is opened.
 * 'New' orders require immediate acknowledgement, so the slider auto-selects
 * 'Acknowledged' to prompt the user to confirm they have seen the order.
 */
export const DEFAULT_STATUS_FOR_NEW_ORDER: OrderStatus = 'Acknowledged';
