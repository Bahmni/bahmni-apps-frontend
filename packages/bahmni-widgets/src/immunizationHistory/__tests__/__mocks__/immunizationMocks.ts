import { Immunization } from 'fhir/r4';

export const mockAdministeredImmunization: Immunization = {
  resourceType: 'Immunization',
  id: 'imm-uuid-1',
  status: 'completed',
  vaccineCode: { coding: [{ display: 'Measles' }] },
  patient: { reference: 'Patient/patient-uuid' },
  occurrenceDateTime: '2026-03-24',
  location: { display: 'Test Hospital' },
  route: { coding: [{ display: 'Intravenous' }] },
  site: { coding: [{ display: 'Shoulder' }] },
  manufacturer: { display: 'Medsource' },
  lotNumber: '12345',
  protocolApplied: [{ doseNumberPositiveInt: 3 }],
  performer: [
    {
      function: { coding: [{ code: 'AP' }] },
      actor: { display: 'Aisha Khan' },
    },
    {
      function: { coding: [{ code: 'OP' }] },
      actor: { display: 'Dr S.Johnson' },
    },
  ],
  note: [{ text: 'Third dose completed successfully.' }],
  extension: [
    {
      url: 'http://fhir.bahmni.org/ext/immunization/administeredProduct', // NOSONAR
      valueReference: { display: 'MisoPrime' },
    },
  ],
};

export const mockMinimalAdministeredImmunization: Immunization = {
  resourceType: 'Immunization',
  id: 'imm-minimal-1',
  status: 'completed',
  vaccineCode: { coding: [{ display: 'Rotavirus' }] },
  patient: { reference: 'Patient/patient-uuid' },
  occurrenceDateTime: '2026-01-10',
  protocolApplied: [{ doseNumberPositiveInt: 1 }],
};

export const mockMinimalNotAdministeredImmunization: Immunization = {
  resourceType: 'Immunization',
  id: 'waiver-minimal-1',
  status: 'not-done',
  vaccineCode: { coding: [{ display: 'Polio' }] },
  patient: { reference: 'Patient/patient-uuid' },
  occurrenceDateTime: '2026-01-01',
};

export const mockNotAdministeredImmunization: Immunization = {
  resourceType: 'Immunization',
  id: 'waiver-uuid-1',
  status: 'not-done',
  vaccineCode: { coding: [{ display: 'Hepatitis B' }] },
  patient: { reference: 'Patient/patient-uuid' },
  occurrenceDateTime: '2026-03-19',
  statusReason: { coding: [{ display: 'Patient refused' }] },
  performer: [
    {
      function: { coding: [{ code: 'AP' }] },
      actor: { display: 'John Davis' },
    },
  ],
};
