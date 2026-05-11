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
    applyBahmniTheme({ primary: '#007d79' });
    const tag = document.getElementById('bahmni-theme');
    expect(tag).not.toBeNull();
    expect(tag?.tagName).toBe('STYLE');
  });

  it('targets :root, .cds--white and .cds--g10 selectors', () => {
    applyBahmniTheme({ primary: '#007d79' });
    const tag = document.getElementById('bahmni-theme') as HTMLStyleElement;
    expect(tag.textContent).toContain(':root,\n.cds--white,\n.cds--g10 {');
  });

  it('reuses the existing style tag on subsequent calls', () => {
    applyBahmniTheme({ primary: '#007d79' });
    applyBahmniTheme({ primary: '#ff0000' });
    const tags = document.querySelectorAll('#bahmni-theme');
    expect(tags).toHaveLength(1);
    expect((tags[0] as HTMLStyleElement).textContent).toContain('#ff0000');
  });

  describe('Token expansion', () => {
    it('expands primary to all 8 derived CSS tokens', () => {
      applyBahmniTheme({ primary: '#ff0000' });
      const tag = document.getElementById('bahmni-theme') as HTMLStyleElement;
      expect(tag.textContent).toContain('--cds-background-brand: #ff0000;');
      expect(tag.textContent).toContain('--cds-button-primary: #ff0000;');
      expect(tag.textContent).toContain('--cds-button-tertiary: #ff0000;');
      expect(tag.textContent).toContain(
        '--cds-button-tertiary-active: #ff0000;',
      );
      expect(tag.textContent).toContain('--cds-interactive: #ff0000;');
      expect(tag.textContent).toContain('--cds-focus: #ff0000;');
      expect(tag.textContent).toContain('--cds-border-interactive: #ff0000;');
      expect(tag.textContent).toContain('--cds-link-primary: #ff0000;');
    });

    it('expands primary-text to text-inverse and icon-inverse CSS tokens', () => {
      applyBahmniTheme({ 'primary-text': '#000000' });
      const tag = document.getElementById('bahmni-theme') as HTMLStyleElement;
      expect(tag.textContent).toContain('--cds-text-inverse: #000000;');
      expect(tag.textContent).toContain('--cds-icon-inverse: #000000;');
    });

    it('expands primary-hover to button-primary-hover and button-tertiary-hover CSS tokens', () => {
      applyBahmniTheme({ 'primary-hover': '#cc0000' });
      const tag = document.getElementById('bahmni-theme') as HTMLStyleElement;
      expect(tag.textContent).toContain('--cds-button-primary-hover: #cc0000;');
      expect(tag.textContent).toContain(
        '--cds-button-tertiary-hover: #cc0000;',
      );
    });

    it('expands link-hover to link-primary-hover and link-secondary CSS tokens', () => {
      applyBahmniTheme({ 'link-hover': '#880000' });
      const tag = document.getElementById('bahmni-theme') as HTMLStyleElement;
      expect(tag.textContent).toContain('--cds-link-primary-hover: #880000;');
      expect(tag.textContent).toContain('--cds-link-secondary: #880000;');
    });

    it('expands link-visited-on-dark to link-inverse-visited CSS token', () => {
      applyBahmniTheme({ 'link-visited-on-dark': '#BE95FF' });
      const tag = document.getElementById('bahmni-theme') as HTMLStyleElement;
      expect(tag.textContent).toContain('--cds-link-inverse-visited: #BE95FF;');
    });

    it('expands background to layer-01 CSS token', () => {
      applyBahmniTheme({ background: '#eeeeee' });
      const tag = document.getElementById('bahmni-theme') as HTMLStyleElement;
      expect(tag.textContent).toContain('--cds-layer-01: #eeeeee;');
    });

    it('applies all 18 CSS tokens when BAHMNI_DEFAULT_THEME is passed', () => {
      applyBahmniTheme(BAHMNI_DEFAULT_THEME);
      const tag = document.getElementById('bahmni-theme') as HTMLStyleElement;
      // primary group
      expect(tag.textContent).toContain('--cds-background-brand: #007d79;');
      expect(tag.textContent).toContain('--cds-button-primary: #007d79;');
      expect(tag.textContent).toContain('--cds-button-tertiary: #007d79;');
      expect(tag.textContent).toContain(
        '--cds-button-tertiary-active: #007d79;',
      );
      expect(tag.textContent).toContain('--cds-interactive: #007d79;');
      expect(tag.textContent).toContain('--cds-focus: #007d79;');
      expect(tag.textContent).toContain('--cds-border-interactive: #007d79;');
      expect(tag.textContent).toContain('--cds-link-primary: #007d79;');
      // primary-text group
      expect(tag.textContent).toContain('--cds-text-inverse: #ffffff;');
      expect(tag.textContent).toContain('--cds-icon-inverse: #ffffff;');
      // primary-hover group
      expect(tag.textContent).toContain('--cds-button-primary-hover: #006b68;');
      expect(tag.textContent).toContain(
        '--cds-button-tertiary-hover: #006b68;',
      );
      // single-token keys
      expect(tag.textContent).toContain(
        '--cds-button-primary-active: #004144;',
      );
      expect(tag.textContent).toContain('--cds-link-primary-hover: #005d5d;');
      expect(tag.textContent).toContain('--cds-link-secondary: #005d5d;');
      expect(tag.textContent).toContain('--cds-link-visited: #8A3FFC;');
      expect(tag.textContent).toContain('--cds-link-inverse-visited: #BE95FF;');
      expect(tag.textContent).toContain('--cds-layer-01: #f4f4f4;');
    });
  });
});
