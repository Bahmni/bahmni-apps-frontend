import React, { ReactNode, useCallback, useContext, useState } from 'react';
import { CommandPalette } from './CommandPalette';
import { CommandPaletteContext } from './CommandPaletteContext';
import { useCommandPaletteConfig } from './useCommandPaletteConfig';
import { useCommandPaletteKeyboard } from './useCommandPaletteKeyboard';

interface CommandPaletteProviderProps {
  children?: ReactNode;
}

const CommandPaletteProviderInner: React.FC<CommandPaletteProviderProps> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const {
    navItems,
    patientActions,
    patientFieldsConfig,
    trigger,
    searchAnnotations,
    t,
  } = useCommandPaletteConfig();

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
        t,
      }}
    >
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
};

export const CommandPaletteProvider: React.FC<CommandPaletteProviderProps> = ({
  children,
}) => {
  const parent = useContext(CommandPaletteContext);
  if (parent) return <>{children}</>;
  return <CommandPaletteProviderInner>{children}</CommandPaletteProviderInner>;
};

CommandPaletteProvider.displayName = 'CommandPaletteProvider';
