import type { PatientProfileResponse } from '@bahmni/services';
import {
  convertToBasicInfoData,
  convertToContactData,
  convertToAddressData,
  convertToAdditionalData,
  convertToRelationshipsData,
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

  describe('convertToRelationshipsData', () => {
    it('should convert patient relationships to RelationshipData array', () => {
      const mockDataWithRelationships = {
        ...mockPatientData,
        patient: {
          ...mockPatientData.patient,
          uuid: 'person-a-uuid',
        },
        relationships: [
          {
            uuid: 'rel-uuid-1',
            display: 'Parent/Child',
            personA: {
              uuid: 'person-a-uuid',
              display: 'John Doe (GAN123456)',
            },
            personB: {
              uuid: 'person-b-uuid',
              display: 'Jane Smith (GAN789012)',
            },
            relationshipType: {
              uuid: 'rel-type-1',
              display: 'Parent/Child',
            },
            voided: false,
            startDate: '2024-01-01T00:00:00.000+0000',
            endDate: '2024-12-31T00:00:00.000+0000',
          },
        ],
      } as unknown as PatientProfileResponse;

      const result = convertToRelationshipsData(mockDataWithRelationships);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rel-uuid-1');
      expect(result[0].relationshipType).toBe('rel-type-1');
      expect(result[0].patientUuid).toBe('person-b-uuid');
      expect(result[0].patientName).toBe('Jane Smith (GAN789012)');
      expect(result[0].tillDate).toBe('2024-12-31');
      expect(result[0].isExisting).toBe(true);
    });

    it('should return empty array when no relationships exist', () => {
      const result = convertToRelationshipsData(mockPatientData);
      expect(result).toEqual([]);
    });

    it('should handle relationships without end date', () => {
      const mockDataWithRelationships = {
        ...mockPatientData,
        patient: {
          ...mockPatientData.patient,
          uuid: 'person-a-uuid',
        },
        relationships: [
          {
            uuid: 'rel-uuid-1',
            display: 'Parent/Child',
            personA: {
              uuid: 'person-a-uuid',
              display: 'John Doe (GAN123456)',
            },
            personB: {
              uuid: 'person-b-uuid',
              display: 'Jane Smith (GAN789012)',
            },
            relationshipType: {
              uuid: 'rel-type-1',
              display: 'Parent/Child',
            },
            voided: false,
            startDate: '2024-01-01T00:00:00.000+0000',
            endDate: null,
          },
        ],
      } as unknown as PatientProfileResponse;

      const result = convertToRelationshipsData(mockDataWithRelationships);

      expect(result).toHaveLength(1);
      expect(result[0].tillDate).toBe('');
    });

    it('should extract patient name correctly from display string', () => {
      const mockDataWithRelationships = {
        ...mockPatientData,
        patient: {
          ...mockPatientData.patient,
          uuid: 'person-a-uuid',
        },
        relationships: [
          {
            uuid: 'rel-uuid-1',
            display: 'Sibling/Sibling',
            personA: {
              uuid: 'person-a-uuid',
              display: 'Test Patient (ABC123)',
            },
            personB: {
              uuid: 'person-b-uuid',
              display: 'Another Patient (XYZ789)',
            },
            relationshipType: {
              uuid: 'rel-type-1',
              display: 'Sibling/Sibling',
            },
            voided: false,
            startDate: '2024-01-01T00:00:00.000+0000',
            endDate: null,
          },
        ],
      } as unknown as PatientProfileResponse;

      const result = convertToRelationshipsData(mockDataWithRelationships);

      expect(result[0].patientName).toBe('Another Patient (XYZ789)');
    });
  });
});
