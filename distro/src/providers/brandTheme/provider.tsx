import { applyBahmniTheme, BAHMNI_DEFAULT_THEME } from '@bahmni/design-system';
import { getConfig } from '@bahmni/services';
import { createConfigProvider } from '@bahmni/widgets';
import React, { ReactNode, useEffect } from 'react';
import { BRAND_THEME_CONFIG_URL } from './constants';
import { BrandThemeContext } from './context';
import { useBrandTheme } from './hook';
import { type BahmniThemeConfig, type BrandThemeContextType } from './models';
import brandThemeSchema from './schema.json';

const InternalBrandThemeProvider = createConfigProvider<
  BahmniThemeConfig,
  BrandThemeContextType
>({
  context: BrandThemeContext,
  queryKey: ['brandTheme'],
  queryFn: () =>
    getConfig<BahmniThemeConfig>(BRAND_THEME_CONFIG_URL, brandThemeSchema),
  valueMapper: (themeConfig, isLoading, error) => ({
    themeConfig,
    isLoading,
    error,
  }),
  id: 'brand-theme',
  name: 'Brand Theme',
  displayName: 'InternalBrandThemeProvider',
});

// Applies resolved brand colours as a CSS side effect once config has loaded.
// Rendered only after InternalBrandThemeProvider confirms the fetch succeeded.
const BrandThemeApplier: React.FC = () => {
  const { themeConfig } = useBrandTheme();
  useEffect(() => {
    applyBahmniTheme({ ...BAHMNI_DEFAULT_THEME, ...(themeConfig ?? {}) });
  }, [themeConfig]);
  return null;
};

export const BrandThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <InternalBrandThemeProvider>
    <BrandThemeApplier />
    {children}
  </InternalBrandThemeProvider>
);

BrandThemeProvider.displayName = 'BrandThemeProvider';
