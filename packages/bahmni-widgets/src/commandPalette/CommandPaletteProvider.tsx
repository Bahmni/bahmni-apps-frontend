import React, {
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
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
} from './models';
import { useCommandPaletteKeyboard } from './useCommandPaletteKeyboard';

interface CommandPaletteProviderProps {
  children?: ReactNode;
  navItems: NavItem[];
  patientActions: PatientAction[];
  patientFieldsConfig: PatientFieldsConfig;
  trigger: TriggerConfig;
  searchAnnotations: SearchAnnotation[];
  portalContainer?: Element | DocumentFragment;
}

const CommandPaletteProviderInner: React.FC<CommandPaletteProviderProps> = ({
  children,
  navItems,
  patientActions,
  patientFieldsConfig,
  trigger,
  searchAnnotations,
  portalContainer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useCommandPaletteKeyboard(isOpen, toggle, trigger);

  const contextValue = useMemo(
    () => ({
      isOpen,
      toggle,
      setOpen: setIsOpen,
      navItems,
      patientActions,
      patientFieldsConfig,
      searchAnnotations,
      portalContainer,
    }),
    [
      isOpen,
      toggle,
      navItems,
      patientActions,
      patientFieldsConfig,
      searchAnnotations,
      portalContainer,
    ],
  );

  return (
    <CommandPaletteContext.Provider value={contextValue}>
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
