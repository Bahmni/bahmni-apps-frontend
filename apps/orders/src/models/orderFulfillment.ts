import { ORDER_PRIORITY } from './ordersConfig';

export interface OrderStatusConfig {
  value: string;
  label: string;
  translationKey: string;
}

export type OrderStatus = OrderStatusConfig['value'];

export interface PatientDetails {
  reference?: string;
  age?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  phoneNumber?: string;
}

/** FHIR R4 Annotation (partial) - order/task notes carry text plus optional authorship. */
export interface FhirAnnotation {
  text: string;
  authoredOn?: string;
  authorReference?: string;
}

/** A FHIR Reference, trimmed to the two fields the UI actually renders/uses. */
export interface FhirReference {
  reference: string;
  display: string;
}

export interface Order {
  id: string;
  patientUuid: string;
  orderName: string;
  priority: ORDER_PRIORITY;
  status: OrderStatus;
  provider: FhirReference | null;
  dateTime: string;
  owner: FhirReference | null;
  providerComments?: string;
  patient?: PatientDetails;
  note: FhirAnnotation[];
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
