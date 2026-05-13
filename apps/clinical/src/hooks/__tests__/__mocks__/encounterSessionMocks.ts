import { Provider } from '@bahmni/services';
import { Encounter } from 'fhir/r4';

export const PATIENT_UUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
export const PRACTITIONER_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
export const ENCOUNTER_TYPE_UUID = 'encounter-type-uuid-1234';

export const mockPractitioner: Provider = {
  uuid: PRACTITIONER_UUID,
  name: 'Dr. Test Provider',
};

export const mockActiveEncounter: Encounter = {
  resourceType: 'Encounter',
  id: 'enc-1234-5678-abcd',
  status: 'in-progress',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
  subject: {
    reference: `Patient/${PATIENT_UUID}`,
    type: 'Patient',
  },
  participant: [
    {
      individual: {
        reference: `Practitioner/${PRACTITIONER_UUID}`,
        type: 'Practitioner',
      },
    },
  ],
  period: {
    start: '2025-05-15T10:00:00+00:00',
  },
};
