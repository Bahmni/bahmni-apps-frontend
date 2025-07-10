/**
 * Patient Mapper Unit Tests
 * Tests for bidirectional patient data transformation utilities
 */

import {
  mapOpenMRSToForm,
  mapFormToCreateRequest,
  mapFormToUpdateRequest,
  mapSearchResultToForm,
  comparePatientData,
  createPatientSummary,
  validateDataConsistency,
  formatDateForDisplay,
  calculateAge,
  calculateBirthdateFromAge,
  sanitizeFormData,
} from '../patientMapper';
import {
  mockPatientFormData,
  mockCreatePatientRequest,
  createMockFormData,
} from '../../../__mocks__/registrationMocks';

describe('Patient Mapper Utilities', () => {
  describe('mapOpenMRSToForm', () => {
    it('should map OpenMRS patient data to form data structure', () => {
      const mockOpenMRSPatient = {
        uuid: 'patient-uuid-1',
        display: 'John Doe - M - OpenMRS ID: 100001',
        identifiers: [
          {
            uuid: 'identifier-uuid-1',
            identifier: '100001',
            identifierType: {
              uuid: 'id-type-1',
              display: 'OpenMRS ID',
              name: 'OpenMRS ID',
            },
            location: {
              uuid: 'location-1',
              display: 'Registration Desk',
              name: 'Registration Desk',
            },
            preferred: true,
            voided: false,
          },
        ],
        person: {
          uuid: 'person-uuid-1',
          display: 'John Doe',
          gender: 'M',
          age: 35,
          birthdate: '1988-05-15',
          birthdateEstimated: false,
          dead: false,
          deathDate: null,
          causeOfDeath: null,
          preferredName: {
            uuid: 'name-uuid-1',
            display: 'John Doe',
            givenName: 'John',
            middleName: 'Michael',
            familyName: 'Doe',
            preferred: true,
          },
          names: [
            {
              uuid: 'name-uuid-1',
              display: 'John Doe',
              givenName: 'John',
              middleName: 'Michael',
              familyName: 'Doe',
              preferred: true,
            },
          ],
          preferredAddress: {
            uuid: 'address-uuid-1',
            display: '123 Main St, Los Angeles, CA 90210',
            address1: '123 Main St',
            address2: 'Apt 4B',
            cityVillage: 'Los Angeles',
            stateProvince: 'California',
            country: 'United States',
            postalCode: '90210',
            countyDistrict: 'Los Angeles County',
            preferred: true,
          },
          addresses: [
            {
              uuid: 'address-uuid-1',
              display: '123 Main St, Los Angeles, CA 90210',
              address1: '123 Main St',
              address2: 'Apt 4B',
              cityVillage: 'Los Angeles',
              stateProvince: 'California',
              country: 'United States',
              postalCode: '90210',
              countyDistrict: 'Los Angeles County',
              preferred: true,
            },
          ],
          attributes: [
            {
              uuid: 'attr-uuid-1',
              value: '+1-555-123-4567',
              attributeType: {
                uuid: 'attr-type-1',
                display: 'Phone Number',
                name: 'Phone Number',
              },
            },
          ],
        },
        voided: false,
      } as any;

      const result = mapOpenMRSToForm(mockOpenMRSPatient);

      expect(result).toEqual({
        givenName: 'John',
        middleName: 'Michael',
        familyName: 'Doe',
        gender: 'M',
        birthdate: '1988-05-15',
        age: 35,
        birthdateEstimated: false,
        identifiers: [
          {
            identifier: '100001',
            identifierType: 'id-type-1',
            location: 'location-1',
            preferred: true,
          },
        ],
        address: {
          address1: '123 Main St',
          address2: 'Apt 4B',
          cityVillage: 'Los Angeles',
          stateProvince: 'California',
          country: 'United States',
          postalCode: '90210',
          countyDistrict: 'Los Angeles County',
          preferred: true,
        },
        attributes: [
          {
            attributeType: 'attr-type-1',
            value: '+1-555-123-4567',
          },
        ],
        photo: undefined,
      });
    });

    it('should handle missing optional fields gracefully', () => {
      const mockOpenMRSPatient = {
        uuid: 'patient-uuid-1',
        display: 'John Doe - M - OpenMRS ID: 100001',
        identifiers: [],
        person: {
          uuid: 'person-uuid-1',
          display: 'John Doe',
          gender: 'M',
          age: 35,
          birthdate: '1988-05-15',
          birthdateEstimated: false,
          dead: false,
          deathDate: null,
          causeOfDeath: null,
          names: [
            {
              uuid: 'name-uuid-1',
              display: 'John Doe',
              givenName: 'John',
              familyName: 'Doe',
              preferred: true,
            },
          ],
          addresses: [],
          attributes: [],
        },
        voided: false,
      } as any;

      const result = mapOpenMRSToForm(mockOpenMRSPatient);

      expect(result.givenName).toBe('John');
      expect(result.familyName).toBe('Doe');
      expect(result.middleName).toBe('');
      expect(result.identifiers).toEqual([]);
      expect(result.address?.address1).toBe('');
      expect(result.attributes).toEqual([]);
    });
  });

  describe('mapFormToCreateRequest', () => {
    it('should map form data to OpenMRS create request structure', () => {
      const result = mapFormToCreateRequest(mockPatientFormData);

      expect(result).toEqual({
        person: {
          names: [
            {
              givenName: 'John',
              middleName: 'Michael',
              familyName: 'Doe',
              preferred: true,
            },
          ],
          gender: 'M',
          birthdate: '1988-05-15',
          age: undefined,
          birthdateEstimated: false,
          addresses: [
            {
              address1: '123 Main St',
              address2: 'Apt 4B',
              cityVillage: 'Los Angeles',
              stateProvince: 'California',
              country: 'United States',
              postalCode: '90210',
              countyDistrict: 'Los Angeles County',
              preferred: true,
            },
          ],
          attributes: [
            {
              attributeType: 'attr-type-1',
              value: '+1-555-123-4567',
            },
            {
              attributeType: 'attr-type-2',
              value: 'john.doe@example.com',
            },
          ],
        },
        identifiers: [
          {
            identifier: '100001',
            identifierType: 'id-type-1',
            location: 'location-1',
            preferred: true,
          },
          {
            identifier: '1234567890',
            identifierType: 'id-type-2',
            location: undefined,
            preferred: false,
          },
        ],
      });
    });

    it('should filter out empty identifiers and attributes', () => {
      const formDataWithEmptyFields = createMockFormData({
        identifiers: [
          {
            identifier: '100001',
            identifierType: 'id-type-1',
            location: 'location-1',
            preferred: true,
          },
          {
            identifier: '',
            identifierType: '',
            location: '',
            preferred: false,
          },
        ],
        attributes: [
          {
            attributeType: 'attr-type-1',
            value: '+1-555-123-4567',
          },
          {
            attributeType: '',
            value: '',
          },
        ],
      });

      const result = mapFormToCreateRequest(formDataWithEmptyFields);

      expect(result.identifiers).toHaveLength(1);
      expect(result.person.attributes).toHaveLength(1);
    });
  });

  describe('comparePatientData', () => {
    it('should detect changes in basic fields', () => {
      const original = createMockFormData();
      const updated = createMockFormData({
        givenName: 'Jonathan',
        age: 36,
      });

      const changes = comparePatientData(original, updated);

      expect(changes).toEqual({
        givenName: {
          oldValue: 'John',
          newValue: 'Jonathan',
        },
        age: {
          oldValue: 35,
          newValue: 36,
        },
      });
    });

    it('should detect address changes', () => {
      const original = createMockFormData();
      const updated = createMockFormData({
        address: {
          ...original.address,
          address1: '456 Oak Ave',
          cityVillage: 'New York',
          preferred: true,
        },
      });

      const changes = comparePatientData(original, updated);

      expect(changes['address.address1']).toEqual({
        oldValue: '123 Main St',
        newValue: '456 Oak Ave',
      });
      expect(changes['address.cityVillage']).toEqual({
        oldValue: 'Los Angeles',
        newValue: 'New York',
      });
    });

    it('should return empty object when no changes detected', () => {
      const original = createMockFormData();
      const updated = createMockFormData();

      const changes = comparePatientData(original, updated);

      expect(changes).toEqual({});
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format date for display', () => {
      const result = formatDateForDisplay('1988-05-15');
      expect(result).toBe('15/05/1988');
    });

    it('should handle invalid dates gracefully', () => {
      const result = formatDateForDisplay('invalid-date');
      expect(result).toBe('invalid-date');
    });

    it('should handle empty dates', () => {
      const result = formatDateForDisplay('');
      expect(result).toBe('');
    });

    it('should handle undefined dates', () => {
      const result = formatDateForDisplay(undefined);
      expect(result).toBe('');
    });
  });

  describe('calculateAge', () => {
    it('should calculate age from birthdate', () => {
      const thirtyFiveYearsAgo = new Date();
      thirtyFiveYearsAgo.setFullYear(thirtyFiveYearsAgo.getFullYear() - 35);

      const result = calculateAge(thirtyFiveYearsAgo.toISOString().split('T')[0]);
      expect(result).toBe(35);
    });

    it('should handle invalid birthdate', () => {
      const result = calculateAge('invalid-date');
      expect(result).toBe(0);
    });

    it('should handle empty birthdate', () => {
      const result = calculateAge('');
      expect(result).toBe(0);
    });
  });

  describe('calculateBirthdateFromAge', () => {
    it('should calculate birthdate from age', () => {
      const result = calculateBirthdateFromAge(35);
      const expectedYear = new Date().getFullYear() - 35;
      expect(result).toBe(`${expectedYear}-01-01`);
    });

    it('should handle invalid age', () => {
      const result = calculateBirthdateFromAge(-1);
      expect(result).toBe('');
    });

    it('should handle extreme age', () => {
      const result = calculateBirthdateFromAge(200);
      expect(result).toBe('');
    });
  });

  describe('sanitizeFormData', () => {
    it('should trim whitespace from names', () => {
      const dirtyFormData = createMockFormData({
        givenName: '  John  ',
        middleName: '  Michael  ',
        familyName: '  Doe  ',
      });

      const result = sanitizeFormData(dirtyFormData);

      expect(result.givenName).toBe('John');
      expect(result.middleName).toBe('Michael');
      expect(result.familyName).toBe('Doe');
    });

    it('should filter out empty identifiers', () => {
      const dirtyFormData = createMockFormData({
        identifiers: [
          {
            identifier: '100001',
            identifierType: 'id-type-1',
            location: 'location-1',
            preferred: true,
          },
          {
            identifier: '   ',
            identifierType: '',
            location: '',
            preferred: false,
          },
        ],
      });

      const result = sanitizeFormData(dirtyFormData);

      expect(result.identifiers).toHaveLength(1);
      expect(result.identifiers[0].identifier).toBe('100001');
    });

    it('should filter out empty attributes', () => {
      const dirtyFormData = createMockFormData({
        attributes: [
          {
            attributeType: 'attr-type-1',
            value: '+1-555-123-4567',
          },
          {
            attributeType: '',
            value: '',
          },
          {
            attributeType: 'attr-type-2',
            value: '   ',
          },
        ],
      });

      const result = sanitizeFormData(dirtyFormData);

      expect(result.attributes).toHaveLength(1);
      expect(result.attributes[0].value).toBe('+1-555-123-4567');
    });
  });

  describe('validateDataConsistency', () => {
    it('should validate successful mapping', () => {
      const original = {
        person: {
          names: [
            {
              givenName: 'John',
              familyName: 'Doe',
            },
          ],
          gender: 'M',
        },
        identifiers: [
          { identifier: '100001' },
        ],
      };

      const mapped = {
        givenName: 'John',
        familyName: 'Doe',
        gender: 'M',
        identifiers: [
          { identifier: '100001' },
        ],
      };

      const result = validateDataConsistency(original, mapped);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect lost required fields', () => {
      const original = {
        person: {
          names: [
            {
              givenName: 'John',
              familyName: 'Doe',
            },
          ],
          gender: 'M',
        },
        identifiers: [
          { identifier: '100001' },
          { identifier: '100002' },
        ],
      };

      const mapped = {
        givenName: '',
        familyName: '',
        gender: '',
        identifiers: [
          { identifier: '100001' },
        ],
      };

      const result = validateDataConsistency(original, mapped);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Given name was lost during mapping');
      expect(result.errors).toContain('Family name was lost during mapping');
      expect(result.errors).toContain('Gender was lost during mapping');
      expect(result.errors).toContain('Identifier count mismatch during mapping');
    });
  });
});
