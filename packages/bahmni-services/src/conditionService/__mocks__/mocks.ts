import { Condition, Bundle } from 'fhir/r4';

export const mockPatientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
export const mockCondition: Condition = {
  resourceType: 'Condition',
  id: '21fc9270-5e82-4073-9468-0bc3c1a105a5',
  meta: {
    versionId: '1742885312000',
    lastUpdated: '2025-03-25T06:48:32.000+00:00',
  },
  text: {
    status: 'generated',
    div: '<div xmlns="http://www.w3.org/1999/xhtml"><table class="hapiPropertyTable"><tbody><tr><td>Id:</td><td>21fc9270-5e82-4073-9468-0bc3c1a105a5</td></tr><tr><td>Clinical Status:</td><td> active </td></tr><tr><td>Code:</td><td>Cyst of Gallbladder</td></tr><tr><td>Subject:</td><td><a href="http://localhost:8080/openmrs/ws/fhir2/R4/Patient/02f47490-d657-48ee-98e7-4c9133ea168b">Steffi Maria Graf (Patient Identifier: ABC200000)</a></td></tr><tr><td>Onset:</td><td> 24 March 2025 18:30:00 </td></tr><tr><td>Recorded Date:</td><td>25/03/2025</td></tr><tr><td>Recorder:</td><td><a href="http://localhost:8080/openmrs/ws/fhir2/R4/Practitioner/d7a669e7-5e07-11ef-8f7c-0242ac120002">Super Man</a></td></tr></tbody></table></div>',
  },
  clinicalStatus: {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active',
        display: 'Active',
      },
    ],
  },
  code: {
    coding: [
      {
        code: '143017AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        display: 'Cyst of Gallbladder',
      },
      {
        system: 'http://snomed.info/sct',
        code: '19286001',
        display: 'Cyst of Gallbladder',
      },
    ],
    text: 'Cyst of Gallbladder',
  },
  subject: {
    reference: 'Patient/02f47490-d657-48ee-98e7-4c9133ea168b',
    type: 'Patient',
    display: 'Steffi Maria Graf (Patient Identifier: ABC200000)',
  },
  onsetDateTime: '2025-03-24T18:30:00+00:00',
  recordedDate: '2025-03-25T06:48:32+00:00',
  recorder: {
    reference: 'Practitioner/d7a669e7-5e07-11ef-8f7c-0242ac120002',
    type: 'Practitioner',
    display: 'Super Man',
  },
};

export const mockConditions: Condition[] = [mockCondition];

export const mockConditionBundle: Bundle = {
  resourceType: 'Bundle',
  id: '8c9cde77-2ae9-4c05-b149-964b4cf3e8f5',
  meta: {
    lastUpdated: '2025-03-25T11:37:34.743+00:00',
  },
  type: 'searchset',
  total: 1,
  link: [
    {
      relation: 'self',
      url: 'http://localhost/openmrs/ws/fhir2/R4/Condition?patient=02f47490-d657-48ee-98e7-4c9133ea168b',
    },
  ],
  entry: [
    {
      fullUrl:
        'http://localhost/openmrs/ws/fhir2/R4/Condition/21fc9270-5e82-4073-9468-0bc3c1a105a5',
      resource: mockCondition,
    },
  ],
};

export const mockEmptyConditionBundle: Bundle = {
  resourceType: 'Bundle',
  id: 'empty-bundle',
  meta: {
    lastUpdated: '2025-03-25T11:37:34.743+00:00',
  },
  type: 'searchset',
  total: 0,
  link: [
    {
      relation: 'self',
      url: 'http://localhost/openmrs/ws/fhir2/R4/Condition?patient=no-conditions',
    },
  ],
  entry: [],
};

export const mockMalformedBundle = {
  resourceType: 'Bundle',
  id: 'malformed-bundle',
  meta: {
    lastUpdated: '2025-03-25T11:37:34.743+00:00',
  },
  type: 'searchset',
  total: 1,
  // missing link array
  entry: [
    {
      resource: {
        // Invalid resource type
        resourceType: 'InvalidType',
        id: 'invalid-condition',
      },
    },
  ],
};
