import type { PatientProfileResponse } from '@bahmni/services';
import {
  convertToBasicInfoData,
  convertToPersonAttributesData,
  convertToAddressData,
  convertToRelationshipsData,
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
