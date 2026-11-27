import { resolveNonCodedAllergenName } from '../utils';

describe('resolveNonCodedAllergenName', () => {
  it('prefers the typed name, trimmed', () => {
    expect(
      resolveNonCodedAllergenName({
        nonCodedAllergen: '  Latex ',
        display: 'Other',
      }),
    ).toBe('Latex');
  });

  it.each([undefined, '', '   '])(
    'defaults to the concept display when the name is %p',
    (nonCodedAllergen) => {
      expect(
        resolveNonCodedAllergenName({ nonCodedAllergen, display: ' Other ' }),
      ).toBe('Other');
    },
  );

  it('falls back to "Other" when both are blank', () => {
    expect(
      resolveNonCodedAllergenName({ nonCodedAllergen: '', display: ' ' }),
    ).toBe('Other');
  });
});
