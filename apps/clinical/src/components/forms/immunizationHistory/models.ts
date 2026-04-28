import { Reference } from 'fhir/r4';
import { InputControlAttributes } from '../../../providers/clinicalConfig/models';

export interface ImmunizationDrug {
  code?: string;
  display: string;
}

export interface ImmunizationLocation {
  uuid?: string;
  display: string;
}

export interface ImmunizationInputEntry {
  id: string;
  drug: ImmunizationDrug | null;
  vaccineCode: {
    code: string;
    display: string;
  };
  administeredOn: Date | null;
  administeredLocation: ImmunizationLocation | null;
  route: string | null;
  site: string | null;
  expiryDate: Date | null;
  manufacturer: string | null;
  batchNumber: string | null;
  doseSequence: number | null;
  note?: string;
  errors: {
    drug?: string;
    administeredOn?: string;
    administeredLocation?: string;
    route?: string;
    site?: string;
    expiryDate?: string;
    manufacturer?: string;
    batchNumber?: string;
    doseSequence?: string;
  };
  hasBeenValidated: boolean;
}

export interface ValueSetComboBoxItem {
  code: string;
  display: string;
  disabled?: boolean;
}

export interface LocationComboBoxItem {
  uuid: string;
  display: string;
}

export interface CreateImmunizationBundleEntriesParams {
  selectedImmunizations: ImmunizationInputEntry[];
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
}

export interface ImmunizationHistoryState {
  selectedImmunizations: ImmunizationInputEntry[];
  attributes: InputControlAttributes[] | undefined;
  addImmunization: (vaccineCode: { code: string; display: string }) => void;
  removeImmunization: (id: string) => void;
  setAttributes: (attrs: InputControlAttributes[]) => void;
  updateAdministeredOn: (id: string, value: Date | null) => void;
  updateVaccineDrug: (id: string, drug: ImmunizationDrug | null) => void;
  updateAdministeredLocation: (
    id: string,
    value: ImmunizationLocation | null,
  ) => void;
  updateRoute: (id: string, value: string) => void;
  updateSite: (id: string, value: string) => void;
  updateExpiryDate: (id: string, value: Date | null) => void;
  updateManufacturer: (id: string, value: string) => void;
  updateBatchNumber: (id: string, value: string) => void;
  updateDoseSequence: (id: string, value: number | null) => void;
  updateNote: (id: string, value: string) => void;
  validateAll: () => boolean;
  reset: () => void;
  getState: () => ImmunizationHistoryState;
}
