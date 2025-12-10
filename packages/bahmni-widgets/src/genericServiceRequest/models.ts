export interface ServiceRequestViewModel {
  id: string;
  testName: string;
  priority: string;
  orderedBy: string;
  orderedDate: string;
  replaces?: string[];
}
