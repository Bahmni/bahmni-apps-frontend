import { FormattedAllergy, AllergenType } from '@bahmni/services';
import {
  getCategoryDisplayName,
  getSeverityDisplayName,
  getSeverityPriority,
  sortAllergiesBySeverity,
} from '../utils';

describe('allergy utils', () => {
  describe('getCategoryDisplayName', () => {
    // Test valid allergen types
    test.each([
      ['food', 'ALLERGY_TYPE_FOOD'],
      ['medication', 'ALLERGY_TYPE_DRUG'],
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

  describe('getSeverityDisplayName', () => {
    // Test valid severity levels
    test.each([
      ['mild', 'SEVERITY_MILD'],
      ['moderate', 'SEVERITY_MODERATE'],
      ['severe', 'SEVERITY_SEVERE'],
    ])('returns correct i18n key for %s severity', (severity, expected) => {
      expect(getSeverityDisplayName(severity)).toBe(expected);
    });

    // Test case insensitivity
    test.each([
      ['MILD', 'SEVERITY_MILD'],
      ['Mild', 'SEVERITY_MILD'],
      ['MiLd', 'SEVERITY_MILD'],
      ['MODERATE', 'SEVERITY_MODERATE'],
      ['Moderate', 'SEVERITY_MODERATE'],
      ['MoDeRaTe', 'SEVERITY_MODERATE'],
      ['SEVERE', 'SEVERITY_SEVERE'],
      ['Severe', 'SEVERITY_SEVERE'],
      ['SeVeRe', 'SEVERITY_SEVERE'],
    ])('handles case insensitive input: %s', (severity, expected) => {
      expect(getSeverityDisplayName(severity)).toBe(expected);
    });

    // Test invalid severity level
    test('returns mild i18n key for invalid severity', () => {
      const invalidSeverity = 'invalid-severity';
      expect(getSeverityDisplayName(invalidSeverity)).toBe('SEVERITY_MILD');
    });

    // Test empty string
    test('returns mild i18n key for empty string', () => {
      expect(getSeverityDisplayName('')).toBe('SEVERITY_MILD');
    });

    // Test undefined handling
    test('returns mild i18n key for undefined input', () => {
      expect(getSeverityDisplayName(undefined as unknown as string)).toBe(
        'SEVERITY_MILD',
      );
    });

    // Test null handling
    test('returns mild i18n key for null input', () => {
      expect(getSeverityDisplayName(null as unknown as string)).toBe(
        'SEVERITY_MILD',
      );
    });
    // Test special characters
    test('returns mild i18n key for special characters', () => {
      const specialChars = '!@#$%^&*()';
      expect(getSeverityDisplayName(specialChars)).toBe('SEVERITY_MILD');
    });

    // Test numeric input
    test('returns mild i18n key for numeric input', () => {
      expect(getSeverityDisplayName('123')).toBe('SEVERITY_MILD');
      expect(getSeverityDisplayName('0')).toBe('SEVERITY_MILD');
    });

    // Test fallback behavior
    test('always returns a valid i18n key', () => {
      const randomInputs = [
        'unknown',
        'high',
        'low',
        'critical',
        'minor',
        'major',
        '',
        ' ',
        null,
        undefined,
      ];

      randomInputs.forEach((input) => {
        const result = getSeverityDisplayName(input as string);
        expect(result).toMatch(/^SEVERITY_(MILD|MODERATE|SEVERE)$/);
      });
    });
  });

  describe('getSeverityPriority', () => {
    // Test valid severity priority order (severity always lowercase)
    test.each([
      ['severe', 0],
      ['moderate', 1],
      ['mild', 2],
    ])('returns correct priority for %s severity', (severity, expected) => {
      expect(getSeverityPriority(severity)).toBe(expected);
    });

    // Test unknown severity
    test('returns 999 for unknown severity', () => {
      expect(getSeverityPriority('unknown')).toBe(999);
      expect(getSeverityPriority('invalid')).toBe(999);
      expect(getSeverityPriority('')).toBe(999);
    });
  });

  describe('sortAllergiesBySeverity', () => {
    const mockAllergies: FormattedAllergy[] = [
      {
        id: 'allergy-1',
        display: 'Mild Allergy',
        severity: 'mild',
        status: 'Active',
        recordedDate: '2023-01-01',
      },
      {
        id: 'allergy-2',
        display: 'Severe Allergy',
        severity: 'severe',
        status: 'Active',
        recordedDate: '2023-01-02',
      },
      {
        id: 'allergy-3',
        display: 'Moderate Allergy',
        severity: 'moderate',
        status: 'Active',
        recordedDate: '2023-01-03',
      },
    ];

    test('sorts allergies by severity: severe → moderate → mild', () => {
      const sorted = sortAllergiesBySeverity(mockAllergies);

      expect(sorted[0].severity).toBe('severe');
      expect(sorted[1].severity).toBe('moderate');
      expect(sorted[2].severity).toBe('mild');
    });

    test('maintains stable sorting for allergies with same severity', () => {
      const allergiesWithSameSeverity: FormattedAllergy[] = [
        {
          id: 'allergy-1',
          display: 'First Severe',
          severity: 'severe',
          status: 'Active',
          recordedDate: '2023-01-01',
        },
        {
          id: 'allergy-2',
          display: 'Mild Allergy',
          severity: 'mild',
          status: 'Active',
          recordedDate: '2023-01-02',
        },
        {
          id: 'allergy-3',
          display: 'Second Severe',
          severity: 'severe',
          status: 'Active',
          recordedDate: '2023-01-03',
        },
      ];

      const sorted = sortAllergiesBySeverity(allergiesWithSameSeverity);

      // Both severe allergies should come first, maintaining original order
      expect(sorted[0].display).toBe('First Severe');
      expect(sorted[1].display).toBe('Second Severe');
      expect(sorted[2].display).toBe('Mild Allergy');
    });

    test('does not mutate original array', () => {
      const original = [...mockAllergies];
      const sorted = sortAllergiesBySeverity(mockAllergies);

      // Original array should be unchanged
      expect(mockAllergies).toEqual(original);
      expect(sorted).not.toBe(mockAllergies); // Different array reference
    });

    test('handles empty array', () => {
      const result = sortAllergiesBySeverity([]);
      expect(result).toEqual([]);
    });

    test('handles single allergy', () => {
      const singleAllergy = [mockAllergies[0]];
      const result = sortAllergiesBySeverity(singleAllergy);
      expect(result).toEqual(singleAllergy);
    });
  });
});
