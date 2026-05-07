import { applyBahmniTheme, BAHMNI_DEFAULT_THEME } from '../applyTheme';

describe('applyBahmniTheme', () => {
  beforeEach(() => {
    document.getElementById('bahmni-theme')?.remove();
  });

  it('does nothing when config is empty', () => {
    applyBahmniTheme({});
    expect(document.getElementById('bahmni-theme')).toBeNull();
  });

  it('creates a style tag with id bahmni-theme on first call', () => {
    applyBahmniTheme({ 'button-primary': '#007d79' });
    const tag = document.getElementById('bahmni-theme');
    expect(tag).not.toBeNull();
    expect(tag?.tagName).toBe('STYLE');
  });

  it('sets correct CSS custom properties on :root, .cds--white and .cds--g10', () => {
    applyBahmniTheme({ 'button-primary': '#007d79', focus: '#007d79' });
    const tag = document.getElementById('bahmni-theme') as HTMLStyleElement;
    expect(tag.textContent).toContain(':root,\n.cds--white,\n.cds--g10 {');
    expect(tag.textContent).toContain('--cds-button-primary: #007d79;');
    expect(tag.textContent).toContain('--cds-focus: #007d79;');
  });

  it('reuses the existing style tag on subsequent calls', () => {
    applyBahmniTheme({ 'button-primary': '#007d79' });
    applyBahmniTheme({ 'button-primary': '#006b68' });
    const tags = document.querySelectorAll('#bahmni-theme');
    expect(tags).toHaveLength(1);
    expect((tags[0] as HTMLStyleElement).textContent).toContain('#006b68');
  });

  it('applies all tokens from BAHMNI_DEFAULT_THEME', () => {
    applyBahmniTheme(BAHMNI_DEFAULT_THEME);
    const tag = document.getElementById('bahmni-theme') as HTMLStyleElement;
    expect(tag.textContent).toContain('--cds-background-brand: #007d79;');
    expect(tag.textContent).toContain('--cds-text-inverse: #ffffff;');
    expect(tag.textContent).toContain('--cds-icon-inverse: #ffffff;');
    expect(tag.textContent).toContain('--cds-button-primary: #007d79;');
    expect(tag.textContent).toContain('--cds-link-primary: #007d79;');
    expect(tag.textContent).toContain('--cds-link-secondary: #005d5d;');
    expect(tag.textContent).toContain('--cds-link-visited: #8A3FFC;');
    expect(tag.textContent).toContain('--cds-link-inverse-visited: #BE95FF;');
  });
});
