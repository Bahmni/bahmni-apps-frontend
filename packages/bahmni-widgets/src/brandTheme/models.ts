import { type BahmniThemeConfig } from '@bahmni/design-system';

export type { BahmniThemeConfig };

export interface BrandThemeContextType {
  themeConfig: BahmniThemeConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
