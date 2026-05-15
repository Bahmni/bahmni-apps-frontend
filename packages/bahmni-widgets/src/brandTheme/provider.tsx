import { applyBrandTheme } from '@bahmni/design-system';
import { getConfig } from '@bahmni/services';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { createConfigProvider } from '../configProvider';
import { BrandThemeContext } from './context';
import { useBrandTheme } from './hook';
import { type BrandThemeConfig, type BrandThemeContextType } from './models';
import brandThemeSchema from './schema.json';

export const BRAND_THEME_URL =
  '/bahmni_config/openmrs/apps/home/brand-extension.json';

// Applies resolved brand colours as a CSS side effect once config has loaded.
// Rendered only after InternalBrandThemeProvider confirms the fetch succeeded.
const BrandThemeApplier: React.FC = () => {
  const { brandThemeConfig } = useBrandTheme();
  useEffect(() => {
    applyBrandTheme(brandThemeConfig ?? {});
  }, [brandThemeConfig]);
  return null;
};

interface BrandThemeProviderProps {
  children: ReactNode;
  configUrl?: string;
}

export const BrandThemeProvider: React.FC<BrandThemeProviderProps> = ({
  children,
  configUrl = BRAND_THEME_URL,
}) => {
  const InternalProvider = useMemo(
    () =>
      createConfigProvider<BrandThemeConfig, BrandThemeContextType>({
        context: BrandThemeContext,
        queryKey: ['brandTheme', configUrl],
        queryFn: () => getConfig<BrandThemeConfig>(configUrl, brandThemeSchema),
        valueMapper: (brandThemeConfig, isLoading, error) => ({
          brandThemeConfig,
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
