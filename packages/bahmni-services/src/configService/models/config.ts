export interface AllergyConceptMap {
  medicationAllergenUuid: string;
  foodAllergenUuid: string;
  environmentalAllergenUuid: string;
  allergyReactionUuid: string;
}

export interface ConsultationPad {
  allergyConceptMap: AllergyConceptMap;
}

export interface Dashboard {
  name: string;
  url: string;
  requiredPrivileges: string[];
  icon?: string;
  default?: boolean;
}

/**
 * Dashboard configuration interface matching appConfig.schema.json
 * Represents the structure of the main dashboard configuration
 */
export interface ClinicalConfig {
  patientInformation: Record<string, unknown>;
  actions: Array<unknown>;
  dashboards: Array<Dashboard>;
  consultationPad: ConsultationPad;
}
