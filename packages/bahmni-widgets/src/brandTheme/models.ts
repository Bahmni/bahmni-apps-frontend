import { type BrandThemeConfig } from '@bahmni/design-system';

export type { BrandThemeConfig };

export interface BrandThemeContextType {
  brandThemeConfig: BrandThemeConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
