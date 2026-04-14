export interface AdministeredImmunizationViewModel {
  id: string;
  code: string | null;
  doseSequence: string | null;
  drugName: string | null;
  administeredOn: string | null;
  administeredLocation: string | null;
  route: string | null;
  site: string | null;
  manufacturer: string | null;
  batchNumber: string | null;
  recordedBy: string | null;
  orderedBy: string | null;
  notes: string | null;
  hasDetails: boolean;
}

export interface NotAdministeredImmunizationViewModel {
  id: string;
  code: string | null;
  reason: string | null;
  date: string | null;
  recordedBy: string | null;
}
