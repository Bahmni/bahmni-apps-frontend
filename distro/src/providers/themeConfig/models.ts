import { type BahmniThemeConfig } from '@bahmni/design-system';

export type { BahmniThemeConfig };

export interface ThemeConfigContextType {
  themeConfig: BahmniThemeConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
