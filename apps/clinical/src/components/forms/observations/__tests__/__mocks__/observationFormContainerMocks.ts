export const mockMinimalPatientData = {
  id: 'test-patient-uuid',
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
};

export const mockEnrichedPatientData = {
  id: 'test-patient-uuid',
  fullName: 'John Doe',
  givenName: 'John',
  familyName: 'Doe',
  gender: 'male',
  birthDate: '1996-01-01',
  birthtime: null,
  formattedAddress: null,
  formattedContact: null,
  identifiers: new Map(),
  identifier: 'BAH-001',
};
