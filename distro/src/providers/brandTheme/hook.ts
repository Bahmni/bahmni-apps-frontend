import { createConfigHook } from '@bahmni/widgets';
import { BrandThemeContext } from './context';
import { type BrandThemeContextType } from './models';

export const useBrandTheme = createConfigHook<BrandThemeContextType>(
  BrandThemeContext,
  'useBrandTheme',
  'BrandThemeProvider',
);
