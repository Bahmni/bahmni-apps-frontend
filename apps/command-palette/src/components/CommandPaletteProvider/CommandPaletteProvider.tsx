import { CommandPaletteProvider as WidgetCommandPaletteProvider } from '@bahmni/widgets';
import React, { type ReactNode } from 'react';
import { useCommandPaletteConfig } from '../../hooks/useCommandPaletteConfig';

interface CommandPaletteProviderProps {
  children?: ReactNode;
}

export const CommandPaletteProvider: React.FC<CommandPaletteProviderProps> = ({
  children,
}) => {
  const config = useCommandPaletteConfig();
  return (
    <WidgetCommandPaletteProvider {...config}>
      {children}
    </WidgetCommandPaletteProvider>
  );
};

CommandPaletteProvider.displayName = 'BahmniCommandPaletteProvider';
