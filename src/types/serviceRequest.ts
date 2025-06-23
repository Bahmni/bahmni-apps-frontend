export interface ServiceRequestInputEntry {
  id: string;
  display: string;
  selectedPriority: SupportedServiceRequestPriority;
}

export type SupportedServiceRequestPriority = 'routine' | 'stat';
