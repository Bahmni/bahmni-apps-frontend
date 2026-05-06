export interface BahmniThemeConfig {
  'background-brand'?: string;
  'text-inverse'?: string;
  'icon-inverse'?: string;
  'button-primary'?: string;
  'button-primary-hover'?: string;
  'button-primary-active'?: string;
  'button-tertiary'?: string;
  'button-tertiary-hover'?: string;
  'button-tertiary-active'?: string;
  interactive?: string;
  focus?: string;
  'border-interactive'?: string;
  'link-primary'?: string;
  'link-primary-hover'?: string;
  'link-secondary'?: string;
  'link-visited'?: string;
  'link-inverse-visited'?: string;
  'layer-01'?: string;
}

export const BAHMNI_DEFAULT_THEME: Required<BahmniThemeConfig> = {
  'background-brand': '#007d79',
  'text-inverse': '#ffffff',
  'icon-inverse': '#ffffff',
  'button-primary': '#007d79',
  'button-primary-hover': '#006b68',
  'button-primary-active': '#004144',
  'button-tertiary': '#007d79',
  'button-tertiary-hover': '#006b68',
  'button-tertiary-active': '#007d79',
  interactive: '#007d79',
  focus: '#007d79',
  'border-interactive': '#007d79',
  'link-primary': '#007d79',
  'link-primary-hover': '#005d5d',
  'link-secondary': '#005d5d',
  'link-visited': '#8A3FFC',
  'link-inverse-visited': '#BE95FF',
  'layer-01': '#f4f4f4',
};

export function isValidHexColour(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

// A <style> tag is used instead of document.documentElement.style.setProperty
// because Carbon v11 defines tokens on .cds--white / .cds--g10 class selectors,
// not just :root. Inline styles on :root cannot override class-level values.
// Appending a <style> tag after Carbon's CSS wins via last-definition cascade.
export function applyBahmniTheme(config: Partial<BahmniThemeConfig>): void {
  if (Object.keys(config).length === 0) return;

  const validEntries = Object.entries(config)
    .map(([token, value]) => {
      if (!isValidHexColour(value as string)) {
        console.warn(
          `Invalid colour value for \`$${token}\` — using Bahmni default`,
        );
        return [token, BAHMNI_DEFAULT_THEME[token as keyof BahmniThemeConfig]];
      }
      return [token, value];
    })
    .filter(([, value]) => value !== undefined);

  if (validEntries.length === 0) return;

  const rules = validEntries
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
