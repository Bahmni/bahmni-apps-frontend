import type {
  FhirRelatedPerson,
  PatientProfileResponse,
} from '@bahmni/services';
import {
  convertToBasicInfoData,
  convertToPersonAttributesData,
  convertToAddressData,
  convertToRelationshipsData,
  convertFhirRelatedPersonsToRelationshipData,
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

  describe('convertFhirRelatedPersonsToRelationshipData', () => {
    it('should convert a FHIR RelatedPerson to RelationshipData', () => {
      const fhirRelatedPersons: FhirRelatedPerson[] = [
        {
          id: 'related-person-uuid-1',
          resourceType: 'RelatedPerson',
          patient: { reference: 'Patient/patient-uuid-123' },
          name: [{ given: ['Jane'], family: 'Smith' }],
          relationship: [
            {
              coding: [
                {
                  system: 'http://fhir.bahmni.org/RelationshipType',
                  code: 'rel-type-uuid-1',
                  display: 'Parent',
                },
              ],
            },
          ],
          extension: [
            {
              url: 'http://fhir.bahmni.org/ext/relatedPatient',
              valueReference: { reference: 'Patient/related-patient-uuid-1' },
            },
          ],
          period: { end: '2024-12-31' },
        } as unknown as FhirRelatedPerson,
      ];

      const result =
        convertFhirRelatedPersonsToRelationshipData(fhirRelatedPersons);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('related-person-uuid-1');
      expect(result[0].relationshipType).toBe('rel-type-uuid-1');
      expect(result[0].relationshipTypeLabel).toBe('Parent');
      expect(result[0].patientUuid).toBe('related-patient-uuid-1');
      expect(result[0].patientName).toBe('Jane Smith');
      expect(result[0].tillDate).toBe('2024-12-31');
      expect(result[0].isExisting).toBe(true);
    });

    it('should convert multiple FHIR RelatedPersons to an array of RelationshipData', () => {
      const fhirRelatedPersons: FhirRelatedPerson[] = [
        {
          id: 'related-person-uuid-1',
          resourceType: 'RelatedPerson',
          patient: { reference: 'Patient/patient-uuid-123' },
          name: [{ given: ['Jane'], family: 'Smith' }],
          relationship: [
            {
              coding: [
                {
                  system: 'http://fhir.bahmni.org/RelationshipType',
                  code: 'rel-type-1',
                  display: 'Parent',
                },
              ],
            },
          ],
          extension: [
            {
              url: 'http://fhir.bahmni.org/ext/relatedPatient',
              valueReference: { reference: 'Patient/rp-uuid-1' },
            },
          ],
        } as unknown as FhirRelatedPerson,
        {
          id: 'related-person-uuid-2',
          resourceType: 'RelatedPerson',
          patient: { reference: 'Patient/patient-uuid-123' },
          name: [{ given: ['Bob'], family: 'Jones' }],
          relationship: [
            {
              coding: [
                {
                  system: 'http://fhir.bahmni.org/RelationshipType',
                  code: 'rel-type-2',
                  display: 'Child',
                },
              ],
            },
          ],
          extension: [
            {
              url: 'http://fhir.bahmni.org/ext/relatedPatient',
              valueReference: { reference: 'Patient/rp-uuid-2' },
            },
          ],
        } as unknown as FhirRelatedPerson,
      ];

      const result =
        convertFhirRelatedPersonsToRelationshipData(fhirRelatedPersons);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('related-person-uuid-1');
      expect(result[1].id).toBe('related-person-uuid-2');
    });

    it('should return undefined patientUuid when extension is missing', () => {
      const fhirRelatedPersons: FhirRelatedPerson[] = [
        {
          id: 'related-person-uuid-1',
          resourceType: 'RelatedPerson',
          patient: { reference: 'Patient/patient-uuid-123' },
          name: [{ given: ['Jane'], family: 'Smith' }],
          relationship: [
            {
              coding: [
                {
                  system: 'http://fhir.bahmni.org/RelationshipType',
                  code: 'rel-type-1',
                  display: 'Parent',
                },
              ],
            },
          ],
        } as unknown as FhirRelatedPerson,
      ];

      const result =
        convertFhirRelatedPersonsToRelationshipData(fhirRelatedPersons);

      expect(result).toHaveLength(1);
      expect(result[0].patientUuid).toBeUndefined();
    });

    it('should return empty tillDate when period.end is absent', () => {
      const fhirRelatedPersons: FhirRelatedPerson[] = [
        {
          id: 'related-person-uuid-1',
          resourceType: 'RelatedPerson',
          patient: { reference: 'Patient/patient-uuid-123' },
          name: [{ given: ['Jane'], family: 'Smith' }],
          relationship: [
            {
              coding: [
                {
                  system: 'http://fhir.bahmni.org/RelationshipType',
                  code: 'rel-type-1',
                  display: 'Parent',
                },
              ],
            },
          ],
          extension: [
            {
              url: 'http://fhir.bahmni.org/ext/relatedPatient',
              valueReference: { reference: 'Patient/rp-uuid-1' },
            },
          ],
        } as unknown as FhirRelatedPerson,
      ];

      const result =
        convertFhirRelatedPersonsToRelationshipData(fhirRelatedPersons);

      expect(result[0].tillDate).toBe('');
    });

    it('should return empty tillDate when period.end is an invalid date', () => {
      const fhirRelatedPersons: FhirRelatedPerson[] = [
        {
          id: 'related-person-uuid-1',
          resourceType: 'RelatedPerson',
          patient: { reference: 'Patient/patient-uuid-123' },
          name: [{ given: ['Jane'], family: 'Smith' }],
          relationship: [
            {
              coding: [
                {
                  system: 'http://fhir.bahmni.org/RelationshipType',
                  code: 'rel-type-1',
                  display: 'Parent',
                },
              ],
            },
          ],
          extension: [
            {
              url: 'http://fhir.bahmni.org/ext/relatedPatient',
              valueReference: { reference: 'Patient/rp-uuid-1' },
            },
          ],
          period: { end: 'not-a-date' },
        } as unknown as FhirRelatedPerson,
      ];

      const result =
        convertFhirRelatedPersonsToRelationshipData(fhirRelatedPersons);

      expect(result[0].tillDate).toBe('');
    });

    it('should filter out entries without an id', () => {
      const fhirRelatedPersons: FhirRelatedPerson[] = [
        {
          resourceType: 'RelatedPerson',
          patient: { reference: 'Patient/patient-uuid-123' },
          name: [{ given: ['Jane'], family: 'Smith' }],
          relationship: [
            {
              coding: [
                {
                  system: 'http://fhir.bahmni.org/RelationshipType',
                  code: 'rel-type-1',
                  display: 'Parent',
                },
              ],
            },
          ],
        } as unknown as FhirRelatedPerson,
        {
          id: 'related-person-uuid-2',
          resourceType: 'RelatedPerson',
          patient: { reference: 'Patient/patient-uuid-123' },
          name: [{ given: ['Bob'], family: 'Jones' }],
          relationship: [
            {
              coding: [
                {
                  system: 'http://fhir.bahmni.org/RelationshipType',
                  code: 'rel-type-2',
                  display: 'Child',
                },
              ],
            },
          ],
        } as unknown as FhirRelatedPerson,
      ];

      const result =
        convertFhirRelatedPersonsToRelationshipData(fhirRelatedPersons);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('related-person-uuid-2');
    });
  });
});
