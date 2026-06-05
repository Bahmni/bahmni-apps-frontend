import type {
  NavItem,
  PatientAction,
  PatientFieldsConfig,
  SearchAnnotation,
  TriggerConfig,
} from '@bahmni/widgets';

export interface CommandPaletteExtension {
  id: string;
  extensionPointId: string;
  label?: string;
  translationKey?: string;
  icon?: string;
  order?: number;
  requiredPrivilege?: string;
  url?: string;
  newTab?: boolean;
  pathTemplate?: string;
  appContext?: string | string[];
}

export interface CommandPaletteAppConfig {
  trigger?: TriggerConfig;
  patientFields?: PatientFieldsConfig;
  searchAnnotations?: SearchAnnotation[];
}

export interface CommandPaletteAppJson {
  id: string;
  commandPalette?: CommandPaletteAppConfig;
}

export interface CommandPaletteConfig {
  navItems: NavItem[];
  patientActions: PatientAction[];
  patientFieldsConfig: PatientFieldsConfig;
  trigger: TriggerConfig;
  searchAnnotations: SearchAnnotation[];
}
