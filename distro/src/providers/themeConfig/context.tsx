import { createContext } from 'react';
import { type ThemeConfigContextType } from './models';

export const ThemeConfigContext = createContext<
  ThemeConfigContextType | undefined
>(undefined);
