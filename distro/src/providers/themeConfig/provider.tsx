import { applyBahmniTheme, BAHMNI_DEFAULT_THEME } from '@bahmni/design-system';
import { getConfig } from '@bahmni/services';
import { createConfigProvider } from '@bahmni/widgets';
import React, { ReactNode, useEffect } from 'react';
import { THEME_CONFIG_URL } from './constants';
import { ThemeConfigContext } from './context';
import { useThemeConfig } from './hook';
import { type BahmniThemeConfig, type ThemeConfigContextType } from './models';
import themeConfigSchema from './schema.json';

const InternalThemeConfigProvider = createConfigProvider<
  BahmniThemeConfig,
  ThemeConfigContextType
>({
  context: ThemeConfigContext,
  queryKey: ['themeConfig'],
  queryFn: () =>
    getConfig<BahmniThemeConfig>(THEME_CONFIG_URL, themeConfigSchema),
  valueMapper: (themeConfig, isLoading, error) => ({
    themeConfig,
    isLoading,
    error,
  }),
  id: 'theme-config',
  name: 'Theme Config',
  displayName: 'InternalThemeConfigProvider',
});

// Applies the resolved theme as a CSS side effect once config has loaded.
// Rendered only after InternalThemeConfigProvider confirms the fetch succeeded.
const ThemeApplier: React.FC = () => {
  const { themeConfig } = useThemeConfig();
  useEffect(() => {
    applyBahmniTheme({ ...BAHMNI_DEFAULT_THEME, ...(themeConfig ?? {}) });
  }, [themeConfig]);
  return null;
};

export const ThemeConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <InternalThemeConfigProvider>
    <ThemeApplier />
    {children}
  </InternalThemeConfigProvider>
);

ThemeConfigProvider.displayName = 'ThemeConfigProvider';
