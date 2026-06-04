import { createContext, useContext } from 'react';
import type { PatientFieldKey } from './commandPaletteConfigSchema';

export type { PatientFieldKey };

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  newTab?: boolean;
}

export interface PatientActionContext {
  patientUuid: string;
  patientIdentifier?: string;
}

export interface PatientAction {
  id: string;
  label: string;
  icon?: string;
  getPath: (context: PatientActionContext) => string;
  basePath: string;
}

export interface PatientFieldsConfig {
  primaryFields: PatientFieldKey[];
  additionalFields: PatientFieldKey[];
}

export type AnnotationSearchType = 'patientAttribute' | 'patientNameOrId';

export interface SearchAnnotation {
  prefix: string;
  label: string;
  searchType?: AnnotationSearchType;
  fieldType: 'person' | 'address';
  fieldsToSearch: string[];
}

export type TriggerConfig =
  | { type: 'combination'; keys: string }
  | { type: 'double'; key: string; interval?: number };

export interface CommandPaletteContextType {
  isOpen: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  navItems: NavItem[];
  patientActions: PatientAction[];
  patientFieldsConfig: PatientFieldsConfig;
  searchAnnotations: SearchAnnotation[];
}

export const CommandPaletteContext =
  createContext<CommandPaletteContextType | null>(null);

export function useCommandPalette(): CommandPaletteContextType {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      'useCommandPalette must be used within a CommandPaletteProvider',
    );
  }
  return ctx;
}
