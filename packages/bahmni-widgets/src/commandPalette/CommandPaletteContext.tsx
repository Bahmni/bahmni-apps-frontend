import { createContext } from 'react';
import type {
  NavItem,
  PatientAction,
  PatientFieldsConfig,
  SearchAnnotation,
} from './models';

export interface CommandPaletteContextType {
  isOpen: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  navItems: NavItem[];
  patientActions: PatientAction[];
  patientFieldsConfig: PatientFieldsConfig;
  searchAnnotations: SearchAnnotation[];
  portalContainer?: Element | DocumentFragment;
}

export const CommandPaletteContext =
  createContext<CommandPaletteContextType | null>(null);
