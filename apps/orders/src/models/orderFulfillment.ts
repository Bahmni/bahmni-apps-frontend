import { LmpData } from '@bahmni/services';

import { ORDER_PRIORITY } from './ordersConfig';

export interface OrderStatusConfig {
  value: string;
  label: string;
  translationKey: string;
}

export type OrderStatus = OrderStatusConfig['value'];

export interface PatientDetails {
  age?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  phoneNumber?: string;
}

export interface Order {
  id: string;
  patientUuid: string;
  orderName: string;
  orderType: string;
  priority: ORDER_PRIORITY;
  status: OrderStatus;
  provider: string;
  dateTime: string;
  owner: string | null;
  ownerUuid?: string;
  providerComments?: string;
  patient?: PatientDetails;
  note?: string;
  lmpData?: LmpData | null;
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
  hasBeenAdmitted: boolean;
}

export interface OrderColumnConfig {
  key: string;
  header: string;
  translationKey: string;
  visible: boolean;
  sortable: boolean;
}

export const isCustomOrderTab = (view: string | undefined): boolean => {
  return view?.toLowerCase().includes('custom') ?? false;
};
