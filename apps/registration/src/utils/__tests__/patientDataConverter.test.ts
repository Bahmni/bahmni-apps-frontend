import type { PatientProfileResponse } from '@bahmni/services';
import {
  convertToBasicInfoData,
  convertToContactData,
  convertToAddressData,
  convertToAdditionalData,
} from '../patientDataConverter';

const mockPatientData: PatientProfileResponse = {
  patient: {
    person: {
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
          attributeType: { display: 'Phone Number' },
          value: '1234567890',
        },
        {
          attributeType: { display: 'Alternate Phone Number' },
          value: '0987654321',
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

  describe('convertToContactData', () => {
    it('should convert patient attributes to ContactData', () => {
      const result = convertToContactData(mockPatientData);
      expect(result?.phoneNumber).toBe('1234567890');
      expect(result?.altPhoneNumber).toBe('0987654321');
    });
  });

  describe('convertToAddressData', () => {
    it('should convert patient address to AddressData', () => {
      const result = convertToAddressData(mockPatientData);
      expect(result?.address1).toBe('123 Main St');
      expect(result?.cityVillage).toBe('Springfield');
    });
  });

  describe('convertToAdditionalData', () => {
    it('should convert patient attributes to AdditionalData', () => {
      const result = convertToAdditionalData(mockPatientData);
      expect(result?.['Phone Number']).toBe('1234567890');
      expect(result?.['Alternate Phone Number']).toBe('0987654321');
    });
  });
});
