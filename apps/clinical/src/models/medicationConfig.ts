import { MedicationOrdersMetadataResponse } from '@bahmni/services';

export interface MedicationConfig
  extends MedicationOrdersMetadataResponse, MedicationJSONConfig {}

export interface DrugFormDefault {
  doseUnits?: string;
  route?: string;
}

export interface StopMedicationFieldConfig {
  isVisible?: boolean;
  isMandatory?: boolean;
}

export interface StopMedicationConfig {
  stopDate?: StopMedicationFieldConfig;
  stopReason?: StopMedicationFieldConfig;
  note?: StopMedicationFieldConfig;
}

export interface MedicationJSONConfig {
  drugFormDefaults?: Record<string, DrugFormDefault>;
  stopReasons?: string[];
  stopMedicationFields?: StopMedicationConfig;
}
