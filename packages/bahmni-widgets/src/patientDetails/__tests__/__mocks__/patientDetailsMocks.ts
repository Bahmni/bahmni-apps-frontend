import { FormattedPatientData } from '@bahmni/services';

export const mockFullPatient: FormattedPatientData = {
  id: 'test-uuid',
  fullName: 'John Doe',
  gender: 'male',
  birthDate: '1990-01-01',
  formattedAddress: null,
  formattedContact: null,
  identifiers: new Map([
    ['MRN', 'MRN123456'],
    ['OpenMRS ID', 'OP789'],
  ]),
};

export const mockMinimalPatient: FormattedPatientData = {
  id: 'test-uuid',
  fullName: null,
  gender: null,
  birthDate: null,
  formattedAddress: null,
  formattedContact: null,
  identifiers: new Map(),
};
