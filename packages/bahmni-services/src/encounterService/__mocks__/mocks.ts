export const mockVisitBundle = {
  resourceType: 'Bundle',
  id: '2c8da098-d083-42bf-a2d4-cc3bb4c67199',
  meta: {
    lastUpdated: '2025-05-15T06:32:41.647+00:00',
  },
  type: 'searchset',
  total: 4,
  link: [
    {
      relation: 'self',
      url: 'http://localhost/openmrs/ws/fhir2/R4/Encounter?_tag=visit&subject%3APatient=02f47490-d657-48ee-98e7-4c9133ea168b',
    },
  ],
  entry: [
    {
      fullUrl:
        'http://localhost/openmrs/ws/fhir2/R4/Encounter/f8c5eeb5-86d9-44d4-b37a-9de74a122a6e',
      resource: {
        resourceType: 'Encounter',
        id: 'f8c5eeb5-86d9-44d4-b37a-9de74a122a6e',
        meta: {
          versionId: '1742486096000',
          lastUpdated: '2025-03-20T15:54:56.000+00:00',
          tag: [
            {
              system: 'http://fhir.openmrs.org/ext/encounter-tag',
              code: 'visit',
              display: 'Visit',
            },
          ],
        },
        status: 'unknown',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
        },
        type: [
          {
            coding: [
              {
                system: 'http://fhir.openmrs.org/code-system/visit-type',
                code: '54f43754-c6ce-4472-890e-0f28acaeaea6',
                display: 'OPD',
              },
            ],
          },
        ],
        subject: {
          reference: 'Patient/02f47490-d657-48ee-98e7-4c9133ea168b',
          type: 'Patient',
          display: 'Steffi Maria Graf (Patient Identifier: ABC200000)',
        },
        period: {
          start: '2025-02-18T09:57:21+00:00',
          end: '2025-02-18T10:17:44+00:00',
        },
        location: [
          {
            location: {
              reference: 'Location/72636eba-29bf-4d6c-97c4-4b04d87a95b5',
              type: 'Location',
              display: 'Bahmni Hospital',
            },
          },
        ],
      },
    },
    {
      fullUrl:
        'http://localhost/openmrs/ws/fhir2/R4/Encounter/0a10f47c-a066-423d-8a99-1a67dd5a199d',
      resource: {
        resourceType: 'Encounter',
        id: '0a10f47c-a066-423d-8a99-1a67dd5a199d',
        meta: {
          versionId: '1742579365000',
          lastUpdated: '2025-03-21T17:49:25.000+00:00',
          tag: [
            {
              system: 'http://fhir.openmrs.org/ext/encounter-tag',
              code: 'visit',
              display: 'Visit',
            },
          ],
        },
        status: 'unknown',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
        },
        type: [
          {
            coding: [
              {
                system: 'http://fhir.openmrs.org/code-system/visit-type',
                code: '54f43754-c6ce-4472-890e-0f28acaeaea6',
                display: 'OPD',
              },
            ],
          },
        ],
        subject: {
          reference: 'Patient/02f47490-d657-48ee-98e7-4c9133ea168b',
          type: 'Patient',
          display: 'Steffi Maria Graf (Patient Identifier: ABC200000)',
        },
        period: {
          start: '2025-03-21T06:11:00+00:00',
          end: '2025-03-21T06:11:03+00:00',
        },
        location: [
          {
            location: {
              reference: 'Location/72636eba-29bf-4d6c-97c4-4b04d87a95b5',
              type: 'Location',
              display: 'Bahmni Hospital',
            },
          },
        ],
      },
    },
    {
      fullUrl:
        'http://localhost/openmrs/ws/fhir2/R4/Encounter/30e8e897-d005-48e6-82ac-3ad1351efb1b',
      resource: {
        resourceType: 'Encounter',
        id: '30e8e897-d005-48e6-82ac-3ad1351efb1b',
        meta: {
          versionId: '1744107291000',
          lastUpdated: '2025-04-08T10:14:51.000+00:00',
          tag: [
            {
              system: 'http://fhir.openmrs.org/ext/encounter-tag',
              code: 'visit',
              display: 'Visit',
            },
          ],
        },
        status: 'unknown',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
        },
        type: [
          {
            coding: [
              {
                system: 'http://fhir.openmrs.org/code-system/visit-type',
                code: '54f43754-c6ce-4472-890e-0f28acaeaea6',
                display: 'OPD',
              },
            ],
          },
        ],
        subject: {
          reference: 'Patient/02f47490-d657-48ee-98e7-4c9133ea168b',
          type: 'Patient',
          display: 'Steffi Maria Graf (Patient Identifier: ABC200000)',
        },
        period: {
          start: '2025-03-24T07:00:15+00:00',
          end: '2025-04-08T10:14:50+00:00',
        },
        location: [
          {
            location: {
              reference: 'Location/72636eba-29bf-4d6c-97c4-4b04d87a95b5',
              type: 'Location',
              display: 'Bahmni Hospital',
            },
          },
        ],
      },
    },
    {
      fullUrl:
        'http://localhost/openmrs/ws/fhir2/R4/Encounter/de947029-15f6-4318-afff-a1cbce3593d2',
      resource: {
        resourceType: 'Encounter',
        id: 'de947029-15f6-4318-afff-a1cbce3593d2',
        meta: {
          versionId: '1744107291000',
          lastUpdated: '2025-04-08T10:14:51.000+00:00',
          tag: [
            {
              system: 'http://fhir.openmrs.org/ext/encounter-tag',
              code: 'visit',
              display: 'Visit',
            },
          ],
        },
        status: 'unknown',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
        },
        type: [
          {
            coding: [
              {
                system: 'http://fhir.openmrs.org/code-system/visit-type',
                code: 'b7494a80-fdf9-49bb-bb40-396c47b40343',
                display: 'IPD',
              },
            ],
          },
        ],
        subject: {
          reference: 'Patient/02f47490-d657-48ee-98e7-4c9133ea168b',
          type: 'Patient',
          display: 'Steffi Maria Graf (Patient Identifier: ABC200000)',
        },
        period: {
          start: '2025-04-08T10:14:51+00:00',
        },
        location: [
          {
            location: {
              reference: 'Location/72636eba-29bf-4d6c-97c4-4b04d87a95b5',
              type: 'Location',
              display: 'Bahmni Hospital',
            },
          },
        ],
      },
    },
  ],
};

// The current active visit is the one without an end date
export const mockActiveVisit = mockVisitBundle.entry[3].resource;

export const mockFormsEncounter = {
  encounterUuid: 'e8c5eeb5-86d9-44d4-b37a-9de74a122a6e',
  encounterDateTime: 1708249041000,
  encounterType: 'Consultation',
  visitUuid: 'f8c5eeb5-86d9-44d4-b37a-9de74a122a6e',
  visitType: 'OPD',
  providers: [
    {
      uuid: 'c1c26908-3f10-11e4-adec-0800271c1b75',
      name: 'Super Man',
      encounterRoleUuid: 'a0b03050-c99b-11e0-9572-0800200c9a66',
    },
  ],
  observations: [
    {
      uuid: 'obs-uuid-1',
      concept: {
        uuid: 'concept-uuid-1',
        name: 'Temperature',
        dataType: 'Numeric',
      },
      value: 98.6,
      observationDateTime: '2024-02-18T09:57:21+00:00',
      voided: false,
    },
  ],
  orders: [],
  extensions: {},
};
