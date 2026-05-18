import { MedicationOrdersMetadataResponse } from '@bahmni/services';

export interface MedicationConfig
  extends MedicationOrdersMetadataResponse,
    MedicationJSONConfig {}

export interface DrugFormDefault {
  doseUnits?: string;
  route?: string;
}

export interface MedicationJSONConfig {
  defaultDurationUnit?: string;
  defaultInstructions?: string;
  drugFormDefaults?: Record<string, DrugFormDefault>;
}
