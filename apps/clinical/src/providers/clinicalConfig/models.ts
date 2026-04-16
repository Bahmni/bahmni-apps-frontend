export interface AllergyConceptMap {
  medicationAllergenUuid: string;
  foodAllergenUuid: string;
  environmentalAllergenUuid: string;
  allergyReactionUuid: string;
}

interface InputControlAttributes {
  key: string;
  required: boolean;
}

export interface InputControl<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  metadata: T;
  encounterTypes: string[];
  privileges: string[];
  attributes: InputControlAttributes[];
}

export interface ImmunizationHistoryConfig {
  administeredLocationTag: string;
  routeConceptUuid: string;
  siteConceptUuid: string;
  vaccineConceptSetUuid: string;
}

export interface EncounterDetailsMetadata {
  defaultEncounterType?: string;
}

export interface EncounterDetailsControl
  extends InputControl<EncounterDetailsMetadata> {}

export interface ImmunizationHistoryControl
  extends InputControl<ImmunizationHistoryConfig> {}

export interface ConsultationPad {
  allergyConceptMap: AllergyConceptMap;
  statDurationInMilliseconds?: number;
  encounterDetails: EncounterDetailsControl;
  allergies?: InputControl;
  investigations?: InputControl;
  medications?: InputControl;
  observationForms?: InputControl;
  vaccinations?: InputControl;
  conditionsAndDiagnoses?: InputControl;
  immunizationConfig?: ImmunizationHistoryControl;
}

export interface Dashboard {
  name: string;
  url: string;
  requiredPrivileges: string[];
  icon?: string;
  default?: boolean;
}

export interface ProgramConfig {
  fields: string[];
}

export interface ContextInformation {
  program?: ProgramConfig;
}

export interface ClinicalConfig {
  patientInformation: Record<string, unknown>;
  contextInformation?: ContextInformation;
  actions: Array<unknown>;
  dashboards: Array<Dashboard>;
  consultationPad: ConsultationPad;
}

export interface ClinicalConfigContextType {
  clinicalConfig: ClinicalConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
