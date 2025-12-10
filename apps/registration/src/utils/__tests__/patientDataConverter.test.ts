import type { PatientProfileResponse } from '@bahmni/services';
import {
  convertToBasicInfoData,
  convertToContactData,
  convertToAddressData,
  convertToAdditionalData,
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

  describe('convertToContactData', () => {
    it('should convert all patient attributes to ContactData (config-driven)', () => {
      const result = convertToContactData(mockPatientData);
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
      const result = convertToContactData(emptyData);
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

  describe('convertToAdditionalData', () => {
    it('should convert all patient attributes to AdditionalData (config-driven)', () => {
      const result = convertToAdditionalData(mockPatientData);
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
            attributes: [],
          },
        },
      };
      const result = convertToAdditionalData(emptyData);
      expect(result).toBeUndefined();
    });
  });

  describe('Data Consistency', () => {
    it('should return same data from both converters (components filter display)', () => {
      const contactData = convertToContactData(mockPatientData);
      const additionalData = convertToAdditionalData(mockPatientData);

      expect(contactData).toEqual(additionalData);
      expect(contactData).toEqual({
        'Phone Number': '1234567890',
        'Alternate Phone Number': '0987654321',
        Occupation: 'Engineer',
      });
    });

    it('should use attribute display name as key', () => {
      const result = convertToContactData(mockPatientData);

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
