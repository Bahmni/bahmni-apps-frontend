import { CommandPaletteProvider as WidgetCommandPaletteProvider } from '@bahmni/widgets';
import React, { type ReactNode } from 'react';
import { COMMAND_PALETTE_ENABLED_STORAGE_KEY } from '../../constants/app';
import { useCommandPaletteConfig } from '../../hooks/useCommandPaletteConfig';

interface CommandPaletteProviderProps {
  children?: ReactNode;
  portalContainer?: Element | DocumentFragment;
}

const EnabledCommandPaletteProvider: React.FC<CommandPaletteProviderProps> = ({
  children,
  portalContainer,
}) => {
  const config = useCommandPaletteConfig();

  return (
    <WidgetCommandPaletteProvider {...config} portalContainer={portalContainer}>
      {children}
    </WidgetCommandPaletteProvider>
  );
};

export const CommandPaletteProvider: React.FC<CommandPaletteProviderProps> = ({
  children,
  portalContainer,
}) => {
  const isCommandPaletteEnabled =
    localStorage.getItem(COMMAND_PALETTE_ENABLED_STORAGE_KEY) === 'true';

  if (!isCommandPaletteEnabled) {
    return children;
  }

  return (
    <EnabledCommandPaletteProvider portalContainer={portalContainer}>
      {children}
    </EnabledCommandPaletteProvider>
  );
};

CommandPaletteProvider.displayName = 'BahmniCommandPaletteProvider';
