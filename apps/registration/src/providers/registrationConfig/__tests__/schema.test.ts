import Ajv from 'ajv';
import schema from '../schema.json';

// Mirrors how getConfig() in @bahmni/services validates the registration
// config at load time. strict is off only to keep the pre-existing
// strictTypes warnings for the extensions block out of the test output; it does
// not change what validates.
const validate = new Ajv({ strict: false }).compile(schema);

const printOption = (overrides: Record<string, unknown> = {}) => ({
  translationKey: 'REGISTRATION_PRINT_REGISTRATION_CARD',
  templateId: 'REG_CARD_V1',
  ...overrides,
});

const isValid = (printOptions: unknown) => validate({ printOptions });

describe('registration config schema: printOptions', () => {
  it('accepts a config without printOptions', () => {
    expect(validate({})).toBe(true);
  });

  it('accepts an empty printOptions list', () => {
    expect(isValid([])).toBe(true);
  });

  it('accepts exactly one option', () => {
    expect(isValid([printOption()])).toBe(true);
  });

  it('accepts more than one option', () => {
    expect(
      isValid([
        printOption(),
        printOption({ translationKey: 'PRINT_B', templateId: 'B' }),
        printOption({ translationKey: 'PRINT_C', templateId: 'C' }),
      ]),
    ).toBe(true);
  });

  it('accepts optional privileges and category', () => {
    expect(
      isValid([
        printOption({
          privileges: ['app:registration'],
          category: 'PRESCRIPTION',
        }),
      ]),
    ).toBe(true);
  });

  it('accepts an empty privileges list', () => {
    expect(isValid([printOption({ privileges: [] })])).toBe(true);
  });

  it('rejects an option without a templateId', () => {
    expect(isValid([{ translationKey: 'REGISTRATION_PRINT_X' }])).toBe(false);
  });

  it('rejects an option without a translationKey', () => {
    expect(isValid([{ templateId: 'REG_CARD_V1' }])).toBe(false);
  });

  it('rejects an option with an unknown property', () => {
    expect(
      isValid([printOption({ templateUrl: '/legacy/print_local.html' })]),
    ).toBe(false);
  });

  it('rejects privileges that are not an array of strings', () => {
    expect(isValid([printOption({ privileges: 'app:registration' })])).toBe(
      false,
    );
    expect(isValid([printOption({ privileges: [1] })])).toBe(false);
  });

  it('rejects printOptions that is not an array', () => {
    expect(isValid(printOption())).toBe(false);
  });
});
