/**
 * Flat view model derived from a FHIR visit Encounter, used by VisitsTable.
 */
export interface VisitViewModel {
  readonly id: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly isActive: boolean;
  readonly visitType: string;
  readonly location: string | null;
}
