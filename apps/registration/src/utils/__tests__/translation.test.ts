import { normalizeTranslationKey } from '@bahmni/services';
import { TFunction } from 'i18next';
import { getTranslatedLabel } from '../translation';

jest.mock('@bahmni/services', () => ({
  normalizeTranslationKey: jest.fn(),
}));

const mockNormalizeTranslationKey =
  normalizeTranslationKey as jest.MockedFunction<typeof normalizeTranslationKey>;

describe('Translation Utils', () => {
  describe('getTranslatedLabel', () => {
    let mockT: jest.MockedFunction<TFunction>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockT = jest.fn() as jest.MockedFunction<TFunction>;
    });

    it('should return translated value when translation exists', () => {
      const module = 'registration';
      const fieldName = 'National ID';
      const normalizedKey = 'REGISTRATION_NATIONAL_ID';
      const translatedValue = 'राष्ट्रीय पहचान';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(mockNormalizeTranslationKey).toHaveBeenCalledWith(
        module,
        fieldName,
      );
      expect(mockT).toHaveBeenCalledWith(normalizedKey);
      expect(result).toBe(translatedValue);
    });

    it('should return original field name when translation does not exist', () => {
      const module = 'registration';
      const fieldName = 'Custom Field';
      const normalizedKey = 'REGISTRATION_CUSTOM_FIELD';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      // When translation doesn't exist, i18next returns the key itself
      mockT.mockReturnValue(normalizedKey);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(mockNormalizeTranslationKey).toHaveBeenCalledWith(
        module,
        fieldName,
      );
      expect(mockT).toHaveBeenCalledWith(normalizedKey);
      expect(result).toBe(fieldName);
    });

    it('should handle field names with spaces', () => {
      const module = 'clinical';
      const fieldName = 'Blood Pressure';
      const normalizedKey = 'CLINICAL_BLOOD_PRESSURE';
      const translatedValue = 'रक्तचाप';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(translatedValue);
    });

    it('should handle camelCase field names', () => {
      const module = 'registration';
      const fieldName = 'phoneNumber';
      const normalizedKey = 'REGISTRATION_PHONENUMBER';
      const translatedValue = 'फ़ोन नंबर';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(translatedValue);
    });

    it('should handle field names with special characters', () => {
      const module = 'registration';
      const fieldName = 'City/Village';
      const normalizedKey = 'REGISTRATION_CITYVILLAGE';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(normalizedKey);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(fieldName);
    });

    it('should work with lowercase module names', () => {
      const module = 'clinical';
      const fieldName = 'Ward Number';
      const normalizedKey = 'CLINICAL_WARD_NUMBER';
      const translatedValue = 'वार्ड संख्या';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(mockNormalizeTranslationKey).toHaveBeenCalledWith(
        module,
        fieldName,
      );
      expect(result).toBe(translatedValue);
    });

    it('should work with uppercase module names', () => {
      const module = 'REGISTRATION';
      const fieldName = 'First Name';
      const normalizedKey = 'REGISTRATION_FIRST_NAME';
      const translatedValue = 'पहला नाम';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(translatedValue);
    });

    it('should handle empty translation string by falling back to field name', () => {
      const module = 'registration';
      const fieldName = 'Some Field';
      const normalizedKey = 'REGISTRATION_SOME_FIELD';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      // Empty string means translation exists but is empty - return it as-is
      mockT.mockReturnValue('');

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe('');
    });

    it('should handle field names with numbers', () => {
      const module = 'clinical';
      const fieldName = 'Ward 2B';
      const normalizedKey = 'CLINICAL_WARD_2B';
      const translatedValue = 'वार्ड 2बी';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(translatedValue);
    });

    it('should handle field names with underscores', () => {
      const module = 'clinical';
      const fieldName = 'patient_name';
      const normalizedKey = 'CLINICAL_PATIENT_NAME';
      const translatedValue = 'रोगी का नाम';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(translatedValue);
    });

    it('should handle complex field names with special characters', () => {
      const module = 'registration';
      const fieldName = "Patient's ID Number (2024)";
      const normalizedKey = 'REGISTRATION_PATIENTS_ID_NUMBER_2024';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(normalizedKey);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(fieldName);
    });
  });
});
