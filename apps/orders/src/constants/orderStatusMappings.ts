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
  'On Hold': 'on-hold',
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
  onhold: 'On Hold',
};

/**
 * Default status pre-populated in the slider when a 'New' order is opened.
 * 'New' orders require immediate acknowledgement, so the slider auto-selects
 * 'Acknowledged' to prompt the user to confirm they have seen the order.
 */
export const DEFAULT_STATUS_FOR_NEW_ORDER: OrderStatus = 'Acknowledged';
