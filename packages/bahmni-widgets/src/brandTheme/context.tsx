import { createContext } from 'react';
import { type BrandThemeContextType } from './models';

export const BrandThemeContext = createContext<
  BrandThemeContextType | undefined
>(undefined);
