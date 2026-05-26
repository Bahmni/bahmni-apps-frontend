import type { PersonAttributeType } from '@bahmni/services';
import { format, parseISO } from 'date-fns';
import type { Patient } from 'fhir/r4';
import {
  convertFhirToBasicInfo,
  convertFhirToPersonAttributes,
  convertFhirToAddressData,
  convertFhirToAdditionalIdentifiers,
  extractMetadata,
  extractDobEstimated,
} from '../fhirPatientToFormData';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(() => ({
    formattedResult: '04 May 2026',
    error: false,
  })),
}));

const personAttributes: PersonAttributeType[] = [
  {
    uuid: 'p1',
    name: 'phoneNumber',
    format: 'java.lang.String',
    sortWeight: 1,
    description: null,
    concept: null,
  },
  {
    uuid: 'p2',
    name: 'email',
    format: 'java.lang.String',
    sortWeight: 2,
    description: null,
    concept: null,
  },
];

const baseFhirPatient: Patient = {
  resourceType: 'Patient',
  id: 'uuid-123',
  identifier: [
    {
      id: 'id-1',
      use: 'official',
      type: { coding: [{ code: 'type-1' }], text: 'Primary' },
      value: 'ABC100',
    },
    { id: 'id-2', type: { coding: [{ code: 'old-type' }] }, value: 'OLD999' },
  ],
  name: [{ id: 'name-1', given: ['John', 'Michael'], family: 'Doe' }],
  gender: 'male',
  birthDate: '1990-05-15',
  extension: [
    {
      url: 'http://fhir.bahmni.org/ext/patient/phonenumber',
      valueString: '+91123',
    },
    { url: 'http://fhir.bahmni.org/ext/patient/email', valueString: 'j@t.com' },
    {
      url: 'http://fhir.bahmni.org/ext/patient/date-created',
      valueDateTime: '2026-05-04T11:53:11+00:00',
    },
  ],
  address: [
    {
      use: 'home',
      city: 'Delhi',
      state: 'Haryana',
      postalCode: '122001',
      extension: [
        {
          url: 'http://fhir.openmrs.org/ext/address',
          extension: [
            {
              url: 'http://fhir.openmrs.org/ext/address#address1',
              valueString: 'Flat 1',
            },
            {
              url: 'http://fhir.openmrs.org/ext/address#address2',
              valueString: 'Sector 5',
            },
          ],
        },
      ],
    },
  ],
};

describe('convertFhirToBasicInfo', () => {
  it('should extract name, gender, birthDate', () => {
    const result = convertFhirToBasicInfo(baseFhirPatient);
    expect(result.firstName).toBe('John');
    expect(result.middleName).toBe('Michael');
    expect(result.lastName).toBe('Doe');
    expect(result.gender).toBe('M');
    expect(result.dateOfBirth).toBe('1990-05-15');
    expect(result.nameUuid).toBe('name-1');
    expect(result.entryType).toBe(false);
  });

  it('should apply gender display function', () => {
    const display = (code: string) => (code === 'M' ? 'Male' : code);
    const result = convertFhirToBasicInfo(baseFhirPatient, display);
    expect(result.gender).toBe('Male');
  });

  it('should extract birthTime from _birthDate extension', () => {
    const patientWithBirthTime = {
      ...baseFhirPatient,
      _birthDate: {
        extension: [
          {
            url: 'http://hl7.org/fhir/StructureDefinition/patient-birthTime',
            valueDateTime: '1990-05-15T08:30:00.000Z',
          },
        ],
      },
    };
    const result = convertFhirToBasicInfo(patientWithBirthTime);
    const expected = format(parseISO('1990-05-15T08:30:00.000Z'), 'HH:mm');
    expect(result.birthTime).toBe(expected);
  });

  it('should return empty birthTime when no _birthDate', () => {
    const result = convertFhirToBasicInfo(baseFhirPatient);
    expect(result.birthTime).toBe('');
  });

  it('should handle estimated birthdate YYYY', () => {
    const result = convertFhirToBasicInfo({
      ...baseFhirPatient,
      birthDate: '1990',
    });
    expect(result.dateOfBirth).toBe('1990-01-01');
    expect(result.entryType).toBe(true);
  });

  it('should handle estimated birthdate YYYY-MM', () => {
    const result = convertFhirToBasicInfo({
      ...baseFhirPatient,
      birthDate: '2023-03',
    });
    expect(result.dateOfBirth).toBe('2023-03-01');
    expect(result.entryType).toBe(true);
  });
});

describe('convertFhirToPersonAttributes', () => {
  it('should map slug extensions to attribute names', () => {
    const result = convertFhirToPersonAttributes(
      baseFhirPatient,
      personAttributes,
    );
    expect(result).toEqual({ phoneNumber: '+91123', email: 'j@t.com' });
  });

  it('should skip date-created and unknown slugs', () => {
    const patient: Patient = {
      ...baseFhirPatient,
      extension: [
        {
          url: 'http://fhir.bahmni.org/ext/patient/date-created',
          valueDateTime: '2026-01-01',
        },
        {
          url: 'http://fhir.bahmni.org/ext/patient/unknownattr',
          valueString: 'x',
        },
      ],
    };
    const result = convertFhirToPersonAttributes(patient, personAttributes);
    expect(result).toBeUndefined();
  });

  it('should return undefined when no extensions', () => {
    const result = convertFhirToPersonAttributes(
      { ...baseFhirPatient, extension: undefined },
      personAttributes,
    );
    expect(result).toBeUndefined();
  });
});

describe('convertFhirToAddressData', () => {
  it('should extract address fields and extensions', () => {
    const result = convertFhirToAddressData(baseFhirPatient);
    expect(result).toEqual({
      address1: 'Flat 1',
      address2: 'Sector 5',
      cityVillage: 'Delhi',
      stateProvince: 'Haryana',
      postalCode: '122001',
    });
  });

  it('should return undefined when no address', () => {
    expect(
      convertFhirToAddressData({ ...baseFhirPatient, address: undefined }),
    ).toBeUndefined();
  });
});

describe('convertFhirToAdditionalIdentifiers', () => {
  it('should extract non-primary identifiers by type code', () => {
    const result = convertFhirToAdditionalIdentifiers(baseFhirPatient);
    expect(result).toEqual({ 'old-type': 'OLD999' });
  });

  it('should return undefined when only primary identifier', () => {
    const patient = {
      ...baseFhirPatient,
      identifier: [baseFhirPatient.identifier![0]],
    };
    expect(convertFhirToAdditionalIdentifiers(patient)).toBeUndefined();
  });
});

describe('extractMetadata', () => {
  it('should extract uuid, identifier, name, registerDate', () => {
    const t = (key: string) => key;
    const result = extractMetadata(baseFhirPatient, t);
    expect(result.patientUuid).toBe('uuid-123');
    expect(result.patientIdentifier).toBe('ABC100');
    expect(result.patientName).toBe('John Michael Doe');
    expect(result.registerDate).toBe('04 May 2026');
  });
});

describe('extractDobEstimated', () => {
  it('should return true for YYYY', () => {
    expect(extractDobEstimated({ ...baseFhirPatient, birthDate: '1990' })).toBe(
      true,
    );
  });

  it('should return true for YYYY-MM', () => {
    expect(
      extractDobEstimated({ ...baseFhirPatient, birthDate: '2023-01' }),
    ).toBe(true);
  });

  it('should return false for YYYY-MM-DD', () => {
    expect(extractDobEstimated(baseFhirPatient)).toBe(false);
  });
});
