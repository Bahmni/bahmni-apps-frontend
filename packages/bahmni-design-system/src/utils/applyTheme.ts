export interface BahmniThemeConfig {
  primary?: string;
  'primary-text'?: string;
  'primary-hover'?: string;
  'primary-active'?: string;
  'link-hover'?: string;
  'link-visited'?: string;
  'link-visited-on-dark'?: string;
  background?: string;
}

export const BAHMNI_DEFAULT_THEME: Required<BahmniThemeConfig> = {
  primary: '#007d79',
  'primary-text': '#ffffff',
  'primary-hover': '#006b68',
  'primary-active': '#004144',
  'link-hover': '#005d5d',
  'link-visited': '#8A3FFC',
  'link-visited-on-dark': '#BE95FF',
  background: '#f4f4f4',
};

// Maps each compact config key to the full set of CSS tokens it controls.
// Tokens that share a colour in Bahmni's default palette are grouped under
// the most semantically representative key so implementers only override once.
const THEME_TOKEN_MAP: Record<keyof BahmniThemeConfig, string[]> = {
  primary: [
    'background-brand',
    'button-primary',
    'button-tertiary',
    'button-tertiary-active',
    'interactive',
    'focus',
    'border-interactive',
    'link-primary',
  ],
  'primary-text': ['text-inverse', 'icon-inverse'],
  'primary-hover': ['button-primary-hover', 'button-tertiary-hover'],
  'primary-active': ['button-primary-active'],
  'link-hover': ['link-primary-hover', 'link-secondary'],
  'link-visited': ['link-visited'],
  'link-visited-on-dark': ['link-inverse-visited'],
  background: ['layer-01'],
};

// A <style> tag is used instead of document.documentElement.style.setProperty
// because Carbon v11 defines tokens on .cds--white / .cds--g10 class selectors,
// not just :root. Inline styles on :root cannot override class-level values.
// Appending a <style> tag after Carbon's CSS wins via last-definition cascade.
export function applyBahmniTheme(config: Partial<BahmniThemeConfig>): void {
  if (Object.keys(config).length === 0) return;

  const cssProperties: [string, string][] = [];

  for (const [key, value] of Object.entries(config) as [
    keyof BahmniThemeConfig,
    string,
  ][]) {
    for (const cssToken of THEME_TOKEN_MAP[key] ?? []) {
      cssProperties.push([cssToken, value]);
    }
  }

  if (cssProperties.length === 0) return;

  const rules = cssProperties
    .map(([token, value]) => `  --cds-${token}: ${value};`)
    .join('\n');

  let tag = document.getElementById('bahmni-theme') as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'bahmni-theme';
    document.head.appendChild(tag);
  }

  tag.textContent = `:root,\n.cds--white,\n.cds--g10 {\n${rules}\n}`;
}
