import { getCategoryDisplayName } from '../allergy';
import { AllergenType } from '@types/concepts';

describe('allergy utils', () => {
  describe('getCategoryDisplayName', () => {
    // Test valid allergen types
    test.each([
      ['food', 'ALLERGY_TYPE_FOOD'],
      ['medication', 'ALLERGY_TYPE_MEDICATION'],
      ['environment', 'ALLERGY_TYPE_ENVIRONMENT'],
    ])('returns correct i18n key for %s type', (type, expected) => {
      expect(getCategoryDisplayName(type as AllergenType)).toBe(expected);
    });

    // Test invalid allergen type
    test('returns input string for invalid allergen type', () => {
      const invalidType = 'invalid-type';
      expect(getCategoryDisplayName(invalidType)).toBe(invalidType);
    });

    // Test empty string
    test('returns empty string for empty input', () => {
      expect(getCategoryDisplayName('')).toBe('');
    });

    // Test undefined handling
    test('returns "undefined" for undefined input', () => {
      expect(getCategoryDisplayName(undefined as unknown as string)).toBe(
        'undefined',
      );
    });

    // Test null handling
    test('returns "null" for null input', () => {
      expect(getCategoryDisplayName(null as unknown as string)).toBe('null');
    });

    // Test case sensitivity
    test('is case sensitive for allergen types', () => {
      expect(getCategoryDisplayName('FOOD')).toBe('FOOD');
      expect(getCategoryDisplayName('Food')).toBe('Food');
    });

    // Test special characters
    test('handles special characters in input', () => {
      const specialChars = '!@#$%^&*()';
      expect(getCategoryDisplayName(specialChars)).toBe(specialChars);
    });
  });
});
