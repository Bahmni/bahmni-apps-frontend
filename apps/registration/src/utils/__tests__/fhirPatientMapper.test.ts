import { PersonAttributeType } from '@bahmni/services';
import { buildFhirPatient } from '../fhirPatientMapper';

const personAttributes: PersonAttributeType[] = [
  {
    uuid: 'phone-uuid',
    name: 'phoneNumber',
    format: 'java.lang.String',
    sortWeight: 1,
    description: null,
    concept: null,
  },
  {
    uuid: 'email-uuid',
    name: 'email',
    format: 'java.lang.String',
    sortWeight: 2,
    description: null,
    concept: null,
  },
];

const baseProfile = {
  patientIdFormat: 'BDH',
  entryType: false,
  firstName: 'John',
  middleName: 'Michael',
  lastName: 'Doe',
  gender: 'male',
  ageYears: '30',
  ageMonths: '0',
  ageDays: '0',
  dateOfBirth: '1993-05-15',
  birthTime: '',
  dobEstimated: false,
  patientIdentifier: {
    identifier: 'BDH200001',
    identifierType: 'id-type-uuid',
    identifierTypeName: 'Patient Identifier',
    preferred: true,
  },
};

const baseInput = {
  profile: baseProfile,
  address: {},
  contact: {},
  additional: {},
  additionalIdentifiers: {},
  personAttributes,
};

describe('buildFhirPatient', () => {
  it('should build correct resourceType, name, gender, birthDate', () => {
    const result = buildFhirPatient(baseInput);

    expect(result.resourceType).toBe('Patient');
    expect(result.name).toEqual([
      { given: ['John', 'Michael'], family: 'Doe' },
    ]);
    expect(result.gender).toBe('male');
    expect(result.birthDate).toBe('1993-05-15');
    expect(result.id).toBeUndefined();
  });

  it('should handle name without middle name', () => {
    const result = buildFhirPatient({
      ...baseInput,
      profile: { ...baseProfile, middleName: '' },
    });
    expect(result.name).toEqual([{ given: ['John'], family: 'Doe' }]);
  });

  it('should map all gender values correctly', () => {
    expect(
      buildFhirPatient({
        ...baseInput,
        profile: { ...baseProfile, gender: 'female' },
      }).gender,
    ).toBe('female');
    expect(
      buildFhirPatient({
        ...baseInput,
        profile: { ...baseProfile, gender: 'Other' },
      }).gender,
    ).toBe('other');
    expect(
      buildFhirPatient({
        ...baseInput,
        profile: { ...baseProfile, gender: '' },
      }).gender,
    ).toBe('unknown');
  });

  it('should truncate birthDate to YYYY-MM when estimated', () => {
    const result = buildFhirPatient({
      ...baseInput,
      profile: { ...baseProfile, dobEstimated: true },
    });
    expect(result.birthDate).toBe('1993-05');
  });

  it('should include _birthDate with birthTime extension when birthTime is set', () => {
    const result = buildFhirPatient({
      ...baseInput,
      profile: { ...baseProfile, birthTime: '1993-05-15T08:30:00.000Z' },
    });

    expect(result._birthDate).toEqual({
      extension: [
        {
          url: 'http://hl7.org/fhir/StructureDefinition/patient-birthTime',
          valueDateTime: '1993-05-15T08:30:00.000Z',
        },
      ],
    });
  });

  it('should omit _birthDate when birthTime is empty', () => {
    const result = buildFhirPatient(baseInput);
    expect(result._birthDate).toBeUndefined();
  });

  it('should set id for update, omit for create', () => {
    expect(buildFhirPatient({ ...baseInput, patientUuid: 'uuid-123' }).id).toBe(
      'uuid-123',
    );
    expect(buildFhirPatient(baseInput).id).toBeUndefined();
  });

  it('should include nameUuid in name for update, omit for create', () => {
    const updateResult = buildFhirPatient({
      ...baseInput,
      patientUuid: 'uuid-123',
      profile: { ...baseProfile, nameUuid: 'name-uuid-456' },
    });
    expect(updateResult.name![0].id).toBe('name-uuid-456');

    const createResult = buildFhirPatient({
      ...baseInput,
      profile: { ...baseProfile, nameUuid: 'stale-name-uuid' },
    });
    expect(createResult.name![0].id).toBeUndefined();
  });

  it('should include primary identifier with type text and location', () => {
    const result = buildFhirPatient({
      ...baseInput,
      loginLocationUuid: 'loc-uuid',
    });
    expect(result.identifier![0]).toEqual({
      use: 'official',
      value: 'BDH200001',
      type: { coding: [{ code: 'id-type-uuid' }], text: 'Patient Identifier' },
      extension: [
        {
          url: 'http://fhir.openmrs.org/ext/patient/identifier#location',
          valueReference: { reference: 'Location/loc-uuid' },
        },
      ],
    });
  });

  it('should omit identifiers when none have values (update scenario)', () => {
    const result = buildFhirPatient({
      ...baseInput,
      profile: {
        ...baseProfile,
        patientIdentifier: { identifierType: 'id-type-uuid', preferred: true },
      },
      patientUuid: 'uuid-123',
    });
    expect(result.identifier).toBeUndefined();
  });

  it('should include additional identifiers with type name, location, and skip empty ones', () => {
    const result = buildFhirPatient({
      ...baseInput,
      additionalIdentifiers: { 'pan-uuid': 'AAAA1234B', 'empty-uuid': '   ' },
      identifierTypeNames: { 'pan-uuid': 'PAN Card', 'empty-uuid': 'Empty' },
      loginLocationUuid: 'loc-uuid',
    });
    expect(result.identifier).toHaveLength(2);
    expect(result.identifier![1]).toEqual({
      value: 'AAAA1234B',
      type: { coding: [{ code: 'pan-uuid' }], text: 'PAN Card' },
      extension: [
        {
          url: 'http://fhir.openmrs.org/ext/patient/identifier#location',
          valueReference: { reference: 'Location/loc-uuid' },
        },
      ],
    });
  });

  it('should build person attribute extensions with values', () => {
    const result = buildFhirPatient({
      ...baseInput,
      contact: { phoneNumber: '+919876543210' },
      additional: { email: 'john@test.com' },
    });
    expect(result.extension).toEqual([
      {
        url: 'http://fhir.bahmni.org/ext/patient/phonenumber',
        valueString: '+919876543210',
      },
      {
        url: 'http://fhir.bahmni.org/ext/patient/email',
        valueString: 'john@test.com',
      },
    ]);
  });

  it('should skip empty attributes on create, send voiding extensions on update', () => {
    const input = {
      ...baseInput,
      contact: { phoneNumber: '+91' },
      additional: { email: '' },
    };

    const createResult = buildFhirPatient(input);
    expect(createResult.extension).toEqual([
      {
        url: 'http://fhir.bahmni.org/ext/patient/phonenumber',
        valueString: '+91',
      },
    ]);

    const updateResult = buildFhirPatient({
      ...input,
      patientUuid: 'uuid-123',
    });
    expect(updateResult.extension).toEqual([
      {
        url: 'http://fhir.bahmni.org/ext/patient/phonenumber',
        valueString: '+91',
      },
      { url: 'http://fhir.bahmni.org/ext/patient/email' },
    ]);
  });

  it('should build address with extensions for address1/address2', () => {
    const result = buildFhirPatient({
      ...baseInput,
      address: {
        address1: 'Flat 101',
        address2: 'Sector 5',
        cityVillage: 'Gurgaon',
        stateProvince: 'Haryana',
        postalCode: '122001',
      },
    });
    expect(result.address).toEqual([
      {
        use: 'home',
        city: 'Gurgaon',
        state: 'Haryana',
        postalCode: '122001',
        extension: [
          {
            url: 'http://fhir.openmrs.org/ext/address',
            extension: [
              {
                url: 'http://fhir.openmrs.org/ext/address#address1',
                valueString: 'Flat 101',
              },
              {
                url: 'http://fhir.openmrs.org/ext/address#address2',
                valueString: 'Sector 5',
              },
            ],
          },
        ],
      },
    ]);
  });

  it('should omit address when all fields empty', () => {
    expect(buildFhirPatient(baseInput).address).toBeUndefined();
  });

  it('should include photo with base64 data when image is provided', () => {
    const result = buildFhirPatient({
      ...baseInput,
      profile: { ...baseProfile, image: '/9j/4AAQbase64data' },
    });
    expect(result.photo).toEqual([
      { contentType: 'image/jpeg', data: '/9j/4AAQbase64data' },
    ]);
  });

  it('should include empty photo array when no image is provided', () => {
    const result = buildFhirPatient(baseInput);
    expect(result.photo).toEqual([]);
  });

  it('should include empty photo array on update when image is removed', () => {
    const result = buildFhirPatient({
      ...baseInput,
      patientUuid: 'uuid-123',
    });
    expect(result.photo).toEqual([]);
  });
});
