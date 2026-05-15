import { applyBahmniTheme, BAHMNI_DEFAULT_THEME } from '@bahmni/design-system';
import { getConfig } from '@bahmni/services';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { createConfigProvider } from '../configProvider';
import { BrandThemeContext } from './context';
import { useBrandTheme } from './hook';
import { type BahmniThemeConfig, type BrandThemeContextType } from './models';
import brandThemeSchema from './schema.json';

export const BRAND_THEME_CONFIG_URL =
  '/bahmni_config/openmrs/apps/home/bahmni-brand.json';

// Applies resolved brand colours as a CSS side effect once config has loaded.
// Rendered only after InternalBrandThemeProvider confirms the fetch succeeded.
const BrandThemeApplier: React.FC = () => {
  const { themeConfig } = useBrandTheme();
  useEffect(() => {
    applyBahmniTheme({ ...BAHMNI_DEFAULT_THEME, ...(themeConfig ?? {}) });
  }, [themeConfig]);
  return null;
};

interface BrandThemeProviderProps {
  children: ReactNode;
  configUrl?: string;
}

export const BrandThemeProvider: React.FC<BrandThemeProviderProps> = ({
  children,
  configUrl = BRAND_THEME_CONFIG_URL,
}) => {
  const InternalProvider = useMemo(
    () =>
      createConfigProvider<BahmniThemeConfig, BrandThemeContextType>({
        context: BrandThemeContext,
        queryKey: ['brandTheme', configUrl],
        queryFn: () =>
          getConfig<BahmniThemeConfig>(configUrl, brandThemeSchema),
        valueMapper: (themeConfig, isLoading, error) => ({
          themeConfig,
          isLoading,
          error,
        }),
        id: 'brand-theme',
        name: 'Brand Theme',
        displayName: 'InternalBrandThemeProvider',
      }),
    [configUrl],
  );

  return (
    <InternalProvider>
      <BrandThemeApplier />
      {children}
    </InternalProvider>
  );
};

BrandThemeProvider.displayName = 'BrandThemeProvider';
