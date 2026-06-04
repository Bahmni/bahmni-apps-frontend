import React, {
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { CommandPalette } from './CommandPalette';
import { CommandPaletteContext } from './CommandPaletteContext';
import type {
  NavItem,
  PatientAction,
  PatientFieldsConfig,
  SearchAnnotation,
  TriggerConfig,
} from './CommandPaletteContext';
import { useCommandPaletteKeyboard } from './useCommandPaletteKeyboard';

export interface CommandPaletteProviderProps {
  children?: ReactNode;
  navItems: NavItem[];
  patientActions: PatientAction[];
  patientFieldsConfig: PatientFieldsConfig;
  trigger: TriggerConfig;
  searchAnnotations: SearchAnnotation[];
}

const CommandPaletteProviderInner: React.FC<CommandPaletteProviderProps> = ({
  children,
  navItems,
  patientActions,
  patientFieldsConfig,
  trigger,
  searchAnnotations,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useCommandPaletteKeyboard(isOpen, toggle, trigger);

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        toggle,
        setOpen: setIsOpen,
        navItems,
        patientActions,
        patientFieldsConfig,
        searchAnnotations,
      }}
    >
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
};

export const CommandPaletteProvider: React.FC<CommandPaletteProviderProps> = (
  props,
) => {
  const parent = useContext(CommandPaletteContext);
  if (parent) return <>{props.children}</>;
  return <CommandPaletteProviderInner {...props} />;
};

CommandPaletteProvider.displayName = 'CommandPaletteProvider';
