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
  expiryDate: string | null;
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
  recordedOn: string | null;
  recordedBy: string | null;
  notes: string | null;
}

export interface AdministeredTabConfig {
  columns: string[];
  expandedFields: string[];
}

export interface NotAdministeredTabConfig {
  columns: string[];
}

export interface ImmunizationHistoryWidgetConfig {
  status?: 'completed' | 'not-done';
  encounterType?: string;
  startEncounterPrivilege?: string;
  administeredFields?: string[];
  notAdministeredFields?: string[];
  /** Input control key the "+" button opens when `status` is fixed to one value. */
  inputControlKey?: string;
  /** Input control key the "+" button opens for the administered tab, when `status` is unset. */
  administeredInputControlKey?: string;
  /** Input control key the "+" button opens for the not-done tab, when `status` is unset. */
  notAdministeredInputControlKey?: string;
}
