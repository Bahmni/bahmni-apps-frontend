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
  title?: string;
  encounterType?: string;
  startEncounterPrivilege?: string;
  administeredFields?: string[];
  notAdministeredFields?: string[];
  inputControlKey?: string;
  administeredInputControlKey?: string;
  notAdministeredInputControlKey?: string;
  editTitle?: string;
  administeredEditTitle?: string;
  notAdministeredEditTitle?: string;
}
