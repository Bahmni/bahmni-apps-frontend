import { useContext } from 'react';
import { CommandPaletteContext } from './CommandPaletteContext';
import type { CommandPaletteContextType } from './CommandPaletteContext';

export function useCommandPalette(): CommandPaletteContextType {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      'useCommandPalette must be used within a CommandPaletteProvider',
    );
  }
  return ctx;
}
