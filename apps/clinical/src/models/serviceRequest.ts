export interface ServiceRequestInputEntry {
  uid: string;
  id: string;
  display: string;
  selectedPriority?: SupportedServiceRequestPriority;
  note?: string;
}

export type SupportedServiceRequestPriority = 'routine' | 'stat';
