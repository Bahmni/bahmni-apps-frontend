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
