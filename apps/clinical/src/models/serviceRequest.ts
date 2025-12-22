export interface ServiceRequestInputEntry {
  id: string;
  display: string;
  selectedPriority?: SupportedServiceRequestPriority;
  note?: string;
}

export type SupportedServiceRequestPriority = 'routine' | 'stat';
