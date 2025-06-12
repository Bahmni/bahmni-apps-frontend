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

/**
 * Interface for radiology investigations grouped by date
 */
export interface RadiologyInvestigationByDate {
  date: string;
  orders: RadiologyInvestigation[];
}
