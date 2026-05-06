import {
  applyBahmniTheme,
  isValidHexColour,
  BAHMNI_DEFAULT_THEME,
} from '../applyTheme';

describe('isValidHexColour', () => {
  it('accepts valid 6-character hex colours', () => {
    expect(isValidHexColour('#007d79')).toBe(true);
    expect(isValidHexColour('#FFFFFF')).toBe(true);
    expect(isValidHexColour('#aAbBcC')).toBe(true);
  });

  it('accepts valid 3-character hex colours', () => {
    expect(isValidHexColour('#fff')).toBe(true);
    expect(isValidHexColour('#ABC')).toBe(true);
    expect(isValidHexColour('#123')).toBe(true);
  });

  it('rejects hex strings missing the hash prefix', () => {
    expect(isValidHexColour('007d79')).toBe(false);
  });

  it('rejects named colours', () => {
    expect(isValidHexColour('red')).toBe(false);
    expect(isValidHexColour('notacolour')).toBe(false);
  });

  it('rejects hex strings of wrong length', () => {
    expect(isValidHexColour('#12')).toBe(false);
    expect(isValidHexColour('#12345')).toBe(false);
    expect(isValidHexColour('#1234567')).toBe(false);
  });

  it('rejects hex strings with non-hex characters', () => {
    expect(isValidHexColour('#gggggg')).toBe(false);
    expect(isValidHexColour('#xyz123')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidHexColour('')).toBe(false);
  });
});

describe('applyBahmniTheme', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    document.getElementById('bahmni-theme')?.remove();
  });

  afterEach(() => {
    warnSpy?.mockRestore();
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

  it('skips invalid hex values and applies only valid ones', () => {
    applyBahmniTheme({
      'button-primary': '#007d79',
      interactive: 'not-a-colour',
      focus: '#fff',
    });
    const tag = document.getElementById('bahmni-theme') as HTMLStyleElement;
    expect(tag.textContent).toContain('--cds-button-primary: #007d79;');
    expect(tag.textContent).toContain('--cds-focus: #fff;');
    expect(tag.textContent).not.toContain('--cds-interactive:');
  });

  it('logs warning for invalid colour values', () => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    applyBahmniTheme({ interactive: 'not-a-colour' });
    expect(warnSpy).toHaveBeenCalledWith(
      'Invalid colour value for `$interactive` — using Bahmni default',
    );
  });

  it('does nothing when all values are invalid', () => {
    applyBahmniTheme({ interactive: 'blue', focus: 'red' });
    expect(document.getElementById('bahmni-theme')).toBeNull();
  });
});
