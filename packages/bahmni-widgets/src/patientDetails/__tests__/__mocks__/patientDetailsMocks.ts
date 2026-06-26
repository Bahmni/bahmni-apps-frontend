import { FormattedPatientData } from '@bahmni/services';

export const mockFullPatient: FormattedPatientData = {
  id: 'test-uuid',
  fullName: 'John Doe',
  givenName: 'John',
  familyName: 'Doe',
  gender: 'male',
  birthDate: '1990-01-01',
  birthtime: null,
  formattedAddress: null,
  formattedContact: null,
  identifiers: new Map([
    ['MRN', 'MRN123456'],
    ['OpenMRS ID', 'OP789'],
  ]),
  identifier: 'MRN123456',
  photoUrl: '/openmrs/ws/fhir2/R4/Patient/test-uuid/$photo',
};

export const mockMinimalPatient: FormattedPatientData = {
  id: 'test-uuid',
  fullName: null,
  givenName: null,
  familyName: null,
  gender: null,
  birthDate: null,
  birthtime: null,
  formattedAddress: null,
  formattedContact: null,
  identifiers: new Map(),
  identifier: null,
  photoUrl: undefined,
};
