export type OrderPriority = 'Routine' | 'Urgent' | 'STAT';
export type OrderStatus = 'New' | 'In Progress' | 'Acknowledged' | 'Completed';

export interface Order {
  id: string;
  orderName: string;
  orderType: string;
  priority: OrderPriority;
  status: OrderStatus;
  provider: string;
  dateTime: string;
  owner: string | null;
}

export interface PatientOrderRow {
  id: string;
  patientName: string;
  identifier: string;
  recentOrdersCount: number;
  totalOrdersCount: number;
  urgentCount: number;
  orders: Order[];
  isExpandable: boolean;
}

export interface OrderColumnConfig {
  key: string;
  header: string;
  translationKey: string;
  visible: boolean;
  sortable: boolean;
}

export const DRUG_ORDER_TAB_LABELS = ['Drug Order', 'IPD Drug Order'];

export const isDrugOrderTab = (tabLabel: string): boolean =>
  DRUG_ORDER_TAB_LABELS.some((label) =>
    tabLabel.toLowerCase().includes(label.toLowerCase()),
  );
