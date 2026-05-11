import { createConfigHook } from '@bahmni/widgets';
import { ThemeConfigContext } from './context';
import { type ThemeConfigContextType } from './models';

export const useThemeConfig = createConfigHook<ThemeConfigContextType>(
  ThemeConfigContext,
  'useThemeConfig',
  'ThemeConfigProvider',
);
