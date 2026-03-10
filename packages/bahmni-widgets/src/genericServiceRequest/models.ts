export enum ServiceRequestStatus {
  Draft = 'draft',
  Active = 'active',
  Completed = 'completed',
  Revoked = 'revoked',
  Unknown = 'unknown',
}

export const STATUS_TRANSLATION_MAP: Record<ServiceRequestStatus, string> = {
  [ServiceRequestStatus.Draft]: 'SERVICE_REQUEST_STATUS_DRAFT',
  [ServiceRequestStatus.Active]: 'SERVICE_REQUEST_STATUS_ACTIVE',
  [ServiceRequestStatus.Completed]: 'SERVICE_REQUEST_STATUS_COMPLETED',
  [ServiceRequestStatus.Revoked]: 'SERVICE_REQUEST_STATUS_REVOKED',
  [ServiceRequestStatus.Unknown]: 'SERVICE_REQUEST_STATUS_UNKNOWN',
};

export interface ServiceRequestViewModel {
  id: string;
  testName: string;
  priority: string;
  orderedBy: string;
  orderedDate: string;
  status: string;
  replaces?: string[];
  note?: string;
}
