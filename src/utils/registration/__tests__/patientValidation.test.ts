/**
 * Patient Validation Unit Tests
 * Tests for comprehensive patient data validation utilities
 */

import {
  validateGivenName,
  validateFamilyName,
  validateMiddleName,
  validateGender,
  validateBirthdate,
  validateAge,
  validateBirthdateAndAge,
  validateIdentifier,
  validateIdentifiers,
  validateEmail,
  validatePhone,
  validateAddressField,
  validatePhoto,
  validatePatientForm,
  validateFormStep,
  validateFieldRealTime,
} from '../patientValidation';
import {
  mockPatientFormData,
  mockMinimalPatientFormData,
  mockInvalidPatientFormData,
  createMockFormData,
  createMockPhotoFile,
} from '../../../__mocks__/registrationMocks';

describe('Patient Validation Utilities', () => {
  describe('validateGivenName', () => {
    it('should validate a valid given name', () => {
      const result = validateGivenName('John');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty given name', () => {
      const result = validateGivenName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject given name with only whitespace', () => {
      const result = validateGivenName('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject given name that is too short', () => {
      const result = validateGivenName('J');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject given name that is too long', () => {
      const longName = 'a'.repeat(51);
      const result = validateGivenName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject given name with invalid characters', () => {
      const result = validateGivenName('John123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept given name with spaces, hyphens, and apostrophes', () => {
      const result = validateGivenName("Mary-Jane O'Connor");
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateFamilyName', () => {
    it('should validate a valid family name', () => {
      const result = validateFamilyName('Doe');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty family name', () => {
      const result = validateFamilyName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateMiddleName', () => {
    it('should accept empty middle name', () => {
      const result = validateMiddleName('');
      expect(result.isValid).toBe(true);
    });

    it('should validate a valid middle name', () => {
      const result = validateMiddleName('Michael');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid middle name characters', () => {
      const result = validateMiddleName('Michael123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateGender', () => {
    it('should validate valid genders', () => {
      expect(validateGender('M').isValid).toBe(true);
      expect(validateGender('F').isValid).toBe(true);
      expect(validateGender('O').isValid).toBe(true);
    });

    it('should reject empty gender', () => {
      const result = validateGender('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid gender values', () => {
      const result = validateGender('X');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateBirthdate', () => {
    it('should accept empty birthdate', () => {
      const result = validateBirthdate('');
      expect(result.isValid).toBe(true);
    });

    it('should validate a valid birthdate', () => {
      const result = validateBirthdate('1988-05-15');
      expect(result.isValid).toBe(true);
    });

    it('should reject future birthdate', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = validateBirthdate(futureDate.toISOString().split('T')[0]);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject birthdate before 1900', () => {
      const result = validateBirthdate('1899-01-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid date format', () => {
      const result = validateBirthdate('invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateAge', () => {
    it('should accept empty age', () => {
      const result = validateAge('');
      expect(result.isValid).toBe(true);
    });

    it('should validate a valid age', () => {
      const result = validateAge(35);
      expect(result.isValid).toBe(true);
    });

    it('should validate age as string', () => {
      const result = validateAge('35');
      expect(result.isValid).toBe(true);
    });

    it('should reject negative age', () => {
      const result = validateAge(-1);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject age over 150', () => {
      const result = validateAge(151);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject non-numeric age', () => {
      const result = validateAge('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateBirthdateAndAge', () => {
    it('should require either birthdate or age', () => {
      const result = validateBirthdateAndAge('', '', false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept only birthdate', () => {
      const result = validateBirthdateAndAge('1988-05-15', '', false);
      expect(result.isValid).toBe(true);
    });

    it('should accept only age', () => {
      const result = validateBirthdateAndAge('', 35, false);
      expect(result.isValid).toBe(true);
    });

    it('should accept consistent birthdate and age', () => {
      const thirtyFiveYearsAgo = new Date();
      thirtyFiveYearsAgo.setFullYear(thirtyFiveYearsAgo.getFullYear() - 35);

      const result = validateBirthdateAndAge(
        thirtyFiveYearsAgo.toISOString().split('T')[0],
        35,
        false
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject inconsistent birthdate and age', () => {
      const result = validateBirthdateAndAge('1988-05-15', 25, false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should allow tolerance for estimated birthdate', () => {
      const result = validateBirthdateAndAge('1988-05-15', 34, true);
      expect(result.isValid).toBe(true);
      expect(result.warning).toBeDefined();
    });
  });

  describe('validateIdentifier', () => {
    it('should validate a valid identifier', () => {
      const result = validateIdentifier('100001', 'id-type-1');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty identifier', () => {
      const result = validateIdentifier('', 'id-type-1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject missing identifier type', () => {
      const result = validateIdentifier('100001', '');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject duplicate identifier', () => {
      const existingIdentifiers = ['100001', '100002'];
      const result = validateIdentifier('100001', 'id-type-1', existingIdentifiers);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept unique identifier', () => {
      const existingIdentifiers = ['100001', '100002'];
      const result = validateIdentifier('100003', 'id-type-1', existingIdentifiers);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateIdentifiers', () => {
    it('should validate valid identifiers array', () => {
      const identifiers = [
        {
          identifier: '100001',
          identifierType: 'id-type-1',
          location: '',
          preferred: true,
        },
      ];
      const result = validateIdentifiers(identifiers);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty identifiers array', () => {
      const result = validateIdentifiers([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject identifiers with empty values', () => {
      const identifiers = [
        {
          identifier: '',
          identifierType: '',
          location: '',
          preferred: true,
        },
      ];
      const result = validateIdentifiers(identifiers);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject duplicate identifiers', () => {
      const identifiers = [
        {
          identifier: '100001',
          identifierType: 'id-type-1',
          location: '',
          preferred: true,
        },
        {
          identifier: '100001',
          identifierType: 'id-type-2',
          location: '',
          preferred: false,
        },
      ];
      const result = validateIdentifiers(identifiers);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateEmail', () => {
    it('should accept empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(true);
    });

    it('should validate valid email', () => {
      const result = validateEmail('john.doe@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject email without domain', () => {
      const result = validateEmail('john@');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validatePhone', () => {
    it('should accept empty phone', () => {
      const result = validatePhone('');
      expect(result.isValid).toBe(true);
    });

    it('should validate valid phone numbers', () => {
      expect(validatePhone('+1-555-123-4567').isValid).toBe(true);
      expect(validatePhone('15551234567').isValid).toBe(true);
      expect(validatePhone('+44 20 7946 0958').isValid).toBe(true);
    });

    it('should reject invalid phone format', () => {
      const result = validatePhone('abc123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject phone starting with 0', () => {
      const result = validatePhone('0123456789');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateAddressField', () => {
    it('should accept empty address field when not required', () => {
      const result = validateAddressField('', 'Address Line 1', false);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty address field when required', () => {
      const result = validateAddressField('', 'Address Line 1', true);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate valid address field', () => {
      const result = validateAddressField('123 Main St', 'Address Line 1');
      expect(result.isValid).toBe(true);
    });

    it('should reject address field that is too long', () => {
      const longAddress = 'a'.repeat(256);
      const result = validateAddressField(longAddress, 'Address Line 1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validatePhoto', () => {
    it('should accept no photo', () => {
      const result = validatePhoto(null as any);
      expect(result.isValid).toBe(true);
    });

    it('should validate valid photo file', () => {
      const file = createMockPhotoFile();
      const result = validatePhoto(file);
      expect(result.isValid).toBe(true);
    });

    it('should reject photo that is too large', () => {
      const file = createMockPhotoFile('large.jpg', 'image/jpeg', 10 * 1024 * 1024); // 10MB
      const result = validatePhoto(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject photo with invalid format', () => {
      const file = createMockPhotoFile('document.pdf', 'application/pdf');
      const result = validatePhoto(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validatePatientForm', () => {
    it('should validate complete valid form', () => {
      const result = validatePatientForm(mockPatientFormData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.missingRequired).toEqual([]);
      expect(result.completeness).toBe(100);
    });

    it('should validate minimal valid form', () => {
      const result = validatePatientForm(mockMinimalPatientFormData);
      expect(result.isValid).toBe(true);
      expect(result.completeness).toBe(100);
    });

    it('should detect multiple validation errors', () => {
      const result = validatePatientForm(mockInvalidPatientFormData);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      expect(result.missingRequired.length).toBeGreaterThan(0);
      expect(result.completeness).toBeLessThan(100);
    });

    it('should detect missing required fields', () => {
      const invalidForm = createMockFormData({
        givenName: '',
        familyName: '',
        gender: undefined,
        identifiers: [],
      });

      const result = validatePatientForm(invalidForm);
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('givenName');
      expect(result.missingRequired).toContain('familyName');
      expect(result.missingRequired).toContain('gender');
      expect(result.missingRequired).toContain('identifiers');
    });

    it('should validate address fields', () => {
      const formWithLongAddress = createMockFormData({
        address: {
          address1: 'a'.repeat(256), // Too long
          address2: '',
          cityVillage: '',
          stateProvince: '',
          country: '',
          postalCode: '',
          countyDistrict: '',
          preferred: true,
        },
      });

      const result = validatePatientForm(formWithLongAddress);
      expect(result.isValid).toBe(false);
      expect(result.errors.address1).toBeDefined();
    });
  });

  describe('validateFormStep', () => {
    it('should validate demographics step', () => {
      const result = validateFormStep(mockPatientFormData, 1);
      expect(result.isValid).toBe(true);
      expect(result.completeness).toBe(100);
    });

    it('should validate identifiers step', () => {
      const result = validateFormStep(mockPatientFormData, 2);
      expect(result.isValid).toBe(true);
      expect(result.completeness).toBe(100);
    });

    it('should validate optional steps', () => {
      const result = validateFormStep(mockPatientFormData, 3); // Address step
      expect(result.isValid).toBe(true);
    });

    it('should detect missing fields in demographics step', () => {
      const invalidForm = createMockFormData({
        givenName: '',
        familyName: '',
      });

      const result = validateFormStep(invalidForm, 1);
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('givenName');
      expect(result.missingRequired).toContain('familyName');
    });

    it('should detect missing identifiers in step 2', () => {
      const invalidForm = createMockFormData({
        identifiers: [],
      });

      const result = validateFormStep(invalidForm, 2);
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('identifiers');
    });
  });

  describe('validateFieldRealTime', () => {
    it('should validate given name field', () => {
      const result = validateFieldRealTime('givenName', 'John', mockPatientFormData);
      expect(result.isValid).toBe(true);
    });

    it('should validate family name field', () => {
      const result = validateFieldRealTime('familyName', 'Doe', mockPatientFormData);
      expect(result.isValid).toBe(true);
    });

    it('should validate email field', () => {
      const result = validateFieldRealTime('email', 'john@example.com', mockPatientFormData);
      expect(result.isValid).toBe(true);
    });

    it('should return valid for unknown fields', () => {
      const result = validateFieldRealTime('unknownField', 'value', mockPatientFormData);
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid field values', () => {
      const result = validateFieldRealTime('email', 'invalid-email', mockPatientFormData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
