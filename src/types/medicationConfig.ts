import { Concept } from './encounterConcepts';

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

export interface Frequency extends Concept {
  frequencyPerDay: number;
}

export interface OrderAttribute {
  uuid: string;
  name: string;
  dataType: string;
  shortName: string;
  units: string | null;
  conceptClass: string;
  hiNormal: string | null;
  lowNormal: string | null;
  set: boolean;
}

export interface MedicationOrdersMetadataResponse {
  doseUnits: Concept[];
  routes: Concept[];
  durationUnits: Concept[];
  dispensingUnits: Concept[];
  dosingRules: string[];
  dosingInstructions: Concept[];
  orderAttributes: OrderAttribute[];
  frequencies: Frequency[];
}
