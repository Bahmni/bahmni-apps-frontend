import { normalizeTranslationKey } from '@bahmni/services';
import { TFunction } from 'i18next';
import { getTranslatedLabel } from '../translation';

jest.mock('@bahmni/services', () => ({
  normalizeTranslationKey: jest.fn(),
}));

const mockNormalizeTranslationKey =
  normalizeTranslationKey as jest.MockedFunction<
    typeof normalizeTranslationKey
  >;

describe('Translation Utils', () => {
  describe('getTranslatedLabel', () => {
    let mockT: jest.MockedFunction<TFunction>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockT = jest.fn() as unknown as jest.MockedFunction<TFunction>;
    });

    it('should return translated value when translation exists', () => {
      const module = 'orders';
      const fieldName = 'Patient Name';
      const normalizedKey = 'ORDERS_PATIENT_NAME';
      const translatedValue = 'रोगी का नाम';

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
      const module = 'orders';
      const fieldName = 'Custom Field';
      const normalizedKey = 'ORDERS_CUSTOM_FIELD';

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
      const module = 'orders';
      const fieldName = 'Order Type';
      const normalizedKey = 'ORDERS_ORDER_TYPE';
      const translatedValue = 'आदेश प्रकार';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(translatedValue);
    });

    it('should handle camelCase field names', () => {
      const module = 'orders';
      const fieldName = 'orderStatus';
      const normalizedKey = 'ORDERS_ORDERSTATUS';
      const translatedValue = 'आदेश स्थिति';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(translatedValue);
    });

    it('should handle field names with special characters', () => {
      const module = 'orders';
      const fieldName = 'Provider/Owner';
      const normalizedKey = 'ORDERS_PROVIDEROWNER';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(normalizedKey);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(fieldName);
    });

    it('should work with lowercase module names', () => {
      const module = 'orders';
      const fieldName = 'Priority';
      const normalizedKey = 'ORDERS_PRIORITY';
      const translatedValue = 'प्राथमिकता';

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
      const module = 'ORDERS';
      const fieldName = 'Status';
      const normalizedKey = 'ORDERS_STATUS';
      const translatedValue = 'स्थिति';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(translatedValue);
    });

    it('should handle empty translation string by falling back to field name', () => {
      const module = 'orders';
      const fieldName = 'Some Field';
      const normalizedKey = 'ORDERS_SOME_FIELD';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      // Empty string means translation exists but is empty - return it as-is
      mockT.mockReturnValue('');

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe('');
    });

    it('should handle field names with numbers', () => {
      const module = 'orders';
      const fieldName = 'Lab Order 2B';
      const normalizedKey = 'ORDERS_LAB_ORDER_2B';
      const translatedValue = 'लैब ऑर्डर 2बी';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(translatedValue);
    });

    it('should handle field names with underscores', () => {
      const module = 'orders';
      const fieldName = 'order_type';
      const normalizedKey = 'ORDERS_ORDER_TYPE';
      const translatedValue = 'आदेश प्रकार';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(translatedValue);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(translatedValue);
    });

    it('should handle complex field names with special characters', () => {
      const module = 'orders';
      const fieldName = "Patient's Order ID (2024)";
      const normalizedKey = 'ORDERS_PATIENTS_ORDER_ID_2024';

      mockNormalizeTranslationKey.mockReturnValue(normalizedKey);
      mockT.mockReturnValue(normalizedKey);

      const result = getTranslatedLabel(mockT, module, fieldName);

      expect(result).toBe(fieldName);
    });
  });
});
