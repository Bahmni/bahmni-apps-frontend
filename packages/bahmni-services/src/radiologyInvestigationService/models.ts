/**
 * Interface for formatted radiology investigation data for display purposes
 */
export interface RadiologyInvestigation {
  id: string;
  testName: string;
  priority: string;
  orderedBy: string;
  orderedDate: string;
  replaces?: string[]; // Array of IDs that this investigation replaces
  note?: string; // Optional note associated with the radiology investigation
}
