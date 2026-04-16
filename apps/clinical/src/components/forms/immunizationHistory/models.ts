import { Reference } from 'fhir/r4';
import { ImmunizationConfig } from '../../../providers/clinicalConfig/models';

export interface ImmunizationInputEntry {
  id: string;
  drugCode: string;
  vaccineCode: {
    code: string;
    display: string;
  };
  administeredOn: Date | null;
  administeredLocation: string | null;
  route: string | null;
  site: string | null;
  expiryDate: Date | null;
  manufacturer: string | null;
  batchNumber: string | null;
  errors: {
    drugCode?: string;
    administeredOn?: string;
    administeredLocation?: string;
    route?: string;
    site?: string;
    expiryDate?: string;
    manufacturer?: string;
    batchNumber?: string;
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
  formFields: ImmunizationConfig['formFields'] | undefined;
  addImmunization: (vaccineCode: { code: string; display: string }) => void;
  removeImmunization: (id: string) => void;
  setFormFields: (fields: ImmunizationConfig['formFields']) => void;
  updateAdministeredOn: (id: string, value: Date | null) => void;
  updateVaccineDrug: (id: string, drugCode: string) => void;
  updateAdministeredLocation: (id: string, value: string) => void;
  updateRoute: (id: string, value: string) => void;
  updateSite: (id: string, value: string) => void;
  updateExpiryDate: (id: string, value: Date | null) => void;
  updateManufacturer: (id: string, value: string) => void;
  updateBatchNumber: (id: string, value: string) => void;
  validateAll: () => boolean;
  reset: () => void;
  getState: () => ImmunizationHistoryState;
}
