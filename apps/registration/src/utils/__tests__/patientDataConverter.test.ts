import type { PatientProfileResponse } from '@bahmni/services';
import {
  convertToBasicInfoData,
  convertToPersonAttributesData,
  convertToAddressData,
} from '../patientDataConverter';

const mockPatientData: PatientProfileResponse = {
  patient: {
    uuid: 'patient-uuid-123',
    display: 'John A Doe',
    identifiers: [],
    person: {
      uuid: 'person-uuid-123',
      display: 'John A Doe',
      names: [
        {
          givenName: 'John',
          middleName: 'A',
          familyName: 'Doe',
          preferred: true,
          uuid: 'name-uuid-123',
        },
      ],
      birthdate: '1990-01-15T00:00:00.000+0000',
      birthtime: '1990-01-15T10:30:00.000+0000',
      birthdateEstimated: false,
      gender: 'M',
      attributes: [
        {
          uuid: 'person-attr-uuid-1',
          display: '1234567890',
          attributeType: {
            uuid: 'attr-uuid-1',
            display: 'Phone Number',
            links: [],
          },
          value: '1234567890',
          voided: false,
          links: [],
          resourceVersion: '1.8',
        },
        {
          uuid: 'person-attr-uuid-2',
          display: '0987654321',
          attributeType: {
            uuid: 'attr-uuid-2',
            display: 'Alternate Phone Number',
            links: [],
          },
          value: '0987654321',
          voided: false,
          links: [],
          resourceVersion: '1.8',
        },
        {
          uuid: 'person-attr-uuid-3',
          display: 'Engineer',
          attributeType: {
            uuid: 'attr-uuid-3',
            display: 'Occupation',
            links: [],
          },
          value: 'Engineer',
          voided: false,
          links: [],
          resourceVersion: '1.8',
        },
      ],
      addresses: [
        {
          address1: '123 Main St',
          cityVillage: 'Springfield',
          stateProvince: 'State',
          postalCode: '12345',
        },
      ],
    },
  },
} as PatientProfileResponse;

describe('patientDataConverter', () => {
  describe('convertToBasicInfoData', () => {
    it('should convert patient data to BasicInfoData', () => {
      const result = convertToBasicInfoData(mockPatientData);
      expect(result?.firstName).toBe('John');
      expect(result?.lastName).toBe('Doe');
      expect(result?.gender).toBe('M');
    });
  });

  describe('convertToPersonAttributesData', () => {
    it('should convert all patient attributes to person attributes data (config-driven)', () => {
      const result = convertToPersonAttributesData(mockPatientData);
      // Keys use display name from attributeType
      expect(result?.['Phone Number']).toBe('1234567890');
      expect(result?.['Alternate Phone Number']).toBe('0987654321');
      expect(result?.['Occupation']).toBe('Engineer');
    });

    it('should return undefined if no attributes exist', () => {
      const emptyData: PatientProfileResponse = {
        ...mockPatientData,
        patient: {
          ...mockPatientData.patient,
          person: {
            ...mockPatientData.patient.person,
            attributes: undefined,
          },
        },
      };
      const result = convertToPersonAttributesData(emptyData);
      expect(result).toBeUndefined();
    });
  });

  describe('convertToAddressData', () => {
    it('should convert patient address to AddressData', () => {
      const result = convertToAddressData(mockPatientData);
      expect(result?.address1).toBe('123 Main St');
      expect(result?.cityVillage).toBe('Springfield');
    });
  });

  describe('Person Attributes Edge Cases', () => {
    it('should return undefined when patient data has empty attributes array', () => {
      const emptyData: PatientProfileResponse = {
        ...mockPatientData,
        patient: {
          ...mockPatientData.patient,
          person: {
            ...mockPatientData.patient.person,
            attributes: [],
          },
        },
      };
      const result = convertToPersonAttributesData(emptyData);
      expect(result).toBeUndefined();
    });

    it('should use attribute display name as key', () => {
      const result = convertToPersonAttributesData(mockPatientData);

      // Keys should match the display name from attributeType
      expect(result).toHaveProperty('Phone Number');
      expect(result).toHaveProperty('Alternate Phone Number');
      expect(result).toHaveProperty('Occupation');

      // Not the name field
      expect(result).not.toHaveProperty('phoneNumber');
      expect(result).not.toHaveProperty('altPhoneNumber');
      expect(result).not.toHaveProperty('occupation');
    });
  });
});
