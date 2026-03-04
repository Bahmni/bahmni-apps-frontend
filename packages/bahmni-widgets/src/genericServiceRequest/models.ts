export enum ServiceRequestStatus {
  Active = 'active',
  Completed = 'completed',
  Revoked = 'revoked',
  Unknown = 'unknown',
}

export const STATUS_TRANSLATION_MAP: Record<ServiceRequestStatus, string> = {
  [ServiceRequestStatus.Active]: 'IN_PROGRESS_STATUS',
  [ServiceRequestStatus.Completed]: 'COMPLETED_STATUS',
  [ServiceRequestStatus.Revoked]: 'REVOKED_STATUS',
  [ServiceRequestStatus.Unknown]: 'UNKNOWN_STATUS',
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
