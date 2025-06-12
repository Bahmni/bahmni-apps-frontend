/**
 * Interface for formatted radiology investigation data for display purposes
 */
export interface RadiologyInvestigation {
  id: string;
  testName: string;
  priority: string;
  orderedBy: string;
  orderedDate: string;
}
