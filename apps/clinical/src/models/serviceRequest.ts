export interface ServiceRequestInputEntry {
  uid: string;
  id: string;
  display: string;
  selectedPriority?: SupportedServiceRequestPriority;
  note?: string;
  occurrenceDate?: Date;
}

export type SupportedServiceRequestPriority = 'routine' | 'stat';
