import type { BahmniThemeConfig } from '@bahmni/design-system';

const THEME_CONFIG_URL = '/bahmni_config/openmrs/apps/home/bahmni-theme.json';

export async function fetchThemeConfig(): Promise<Partial<BahmniThemeConfig>> {
  try {
    const res = await fetch(THEME_CONFIG_URL);
    if (!res.ok) return {};
    return res.json() as Promise<Partial<BahmniThemeConfig>>;
  } catch {
    return {};
  }
}
