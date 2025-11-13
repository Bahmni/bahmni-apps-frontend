import { RadiologyInvestigation } from '@bahmni-frontend/bahmni-services';
import { Bundle, ServiceRequest } from 'fhir/r4';

// Mock patient UUID
export const mockPatientUUID = 'c81876c3-b464-486a-9ebf-20eea9431fb1';

// Mock FHIR radiology investigations based on real FHIR data structure
export const mockFhirRadiologyTests: ServiceRequest[] = [
  // Replacing entry (status: unknown) - from original FHIR data
  {
    resourceType: 'ServiceRequest',
    id: '207172a2-27e3-4fef-bea2-85fb826575e4',
    meta: {
      versionId: '1749804495000',
      lastUpdated: '2025-06-13T08:48:15.000+00:00',
    },
    replaces: [
      {
        reference: 'ServiceRequest/271f2b4f-a239-418b-ba9e-f23014093df3',
        type: 'ServiceRequest',
        identifier: {
          use: 'usual',
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                code: 'PLAC',
                display: 'Placer Identifier',
              },
            ],
          },
          value: 'ORD-30',
        },
      },
    ],
    status: 'unknown',
    intent: 'order',
    category: [
      {
        coding: [
          {
            system: 'http://fhir.bahmni.org/code-system/order-type',
            code: 'd3561dc0-5e07-11ef-8f7c-0242ac120002',
            display: 'Radiology Order',
          },
        ],
        text: 'Radiology Order',
      },
    ],
    priority: 'routine',
    code: {
      coding: [
        {
          code: '40d1df86-45bd-4925-b831-7015da66d863',
          display: 'Magnetic resonance imaging of thoracolumbar spine',
        },
        {
          system: 'http://snomed.info/sct',
          code: '700319007',
        },
      ],
      text: 'Magnetic resonance imaging of thoracolumbar spine',
    },
    subject: {
      reference: `Patient/${mockPatientUUID}`,
      type: 'Patient',
      display: 'Micheal James Anderson (Patient Identifier: ABC200003)',
    },
    encounter: {
      reference: 'Encounter/89a4fba9-5202-4403-b525-574f7a006819',
      type: 'Encounter',
    },
    occurrencePeriod: {
      start: '2025-06-13T08:48:15+00:00',
      end: '2025-06-13T08:48:15+00:00',
    },
    requester: {
      reference: 'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
      type: 'Practitioner',
      identifier: {
        value: 'superman',
      },
      display: 'Super Man',
    },
  },
  // Replaced entry (status: completed) - from original FHIR data
  {
    resourceType: 'ServiceRequest',
    id: '271f2b4f-a239-418b-ba9e-f23014093df3',
    meta: {
      versionId: '1749804479000',
      lastUpdated: '2025-06-13T08:47:59.000+00:00',
    },
    status: 'completed',
    intent: 'order',
    category: [
      {
        coding: [
          {
            system: 'http://fhir.bahmni.org/code-system/order-type',
            code: 'd3561dc0-5e07-11ef-8f7c-0242ac120002',
            display: 'Radiology Order',
          },
        ],
        text: 'Radiology Order',
      },
    ],
    priority: 'routine',
    code: {
      coding: [
        {
          code: '40d1df86-45bd-4925-b831-7015da66d863',
          display: 'Magnetic resonance imaging of thoracolumbar spine',
        },
        {
          system: 'http://snomed.info/sct',
          code: '700319007',
        },
      ],
      text: 'Magnetic resonance imaging of thoracolumbar spine',
    },
    subject: {
      reference: `Patient/${mockPatientUUID}`,
      type: 'Patient',
      display: 'Micheal James Anderson (Patient Identifier: ABC200003)',
    },
    encounter: {
      reference: 'Encounter/89a4fba9-5202-4403-b525-574f7a006819',
      type: 'Encounter',
    },
    occurrencePeriod: {
      start: '2025-06-13T08:47:58+00:00',
      end: '2025-06-13T08:48:14+00:00',
    },
    requester: {
      reference: 'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
      type: 'Practitioner',
      identifier: {
        value: 'superman',
      },
      display: 'Super Man',
    },
  },
  // Standalone entry (should remain after filtering)
  {
    resourceType: 'ServiceRequest',
    id: '9c847638-295b-4e3e-933d-47d5cad34faf',
    meta: {
      versionId: '1749795860000',
      lastUpdated: '2025-06-13T06:24:20.000+00:00',
    },
    status: 'completed',
    intent: 'order',
    category: [
      {
        coding: [
          {
            system: 'http://fhir.bahmni.org/code-system/order-type',
            code: 'd3561dc0-5e07-11ef-8f7c-0242ac120002',
            display: 'Radiology Order',
          },
        ],
        text: 'Radiology Order',
      },
    ],
    priority: 'routine',
    code: {
      coding: [
        {
          code: '161295AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'X-ray of chest, 2 views and apical lordotic',
        },
        {
          system: 'http://snomed.info/sct',
          code: '399208008',
        },
      ],
      text: 'X-ray of chest, 2 views and apical lordotic',
    },
    subject: {
      reference: `Patient/${mockPatientUUID}`,
      type: 'Patient',
      display: 'Micheal James Anderson (Patient Identifier: ABC200003)',
    },
    encounter: {
      reference: 'Encounter/85f5e4fa-2aeb-430c-8175-0e0c6d8b21b1',
      type: 'Encounter',
    },
    occurrencePeriod: {
      start: '2025-06-13T06:24:20+00:00',
      end: '2025-06-13T07:24:20+00:00',
    },
    requester: {
      reference: 'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
      type: 'Practitioner',
      identifier: {
        value: 'superman',
      },
      display: 'Super Man',
    },
  },
];

// Additional test scenarios
export const mockRadiologyTestBasic: ServiceRequest = {
  resourceType: 'ServiceRequest',
  id: 'order-1',
  status: 'active',
  intent: 'order',
  subject: { reference: `Patient/${mockPatientUUID}` },
  code: {
    text: 'Chest X-Ray',
  },
  priority: 'urgent',
  requester: {
    display: 'Dr. Smith',
  },
  occurrencePeriod: {
    start: '2023-10-15T10:30:00.000Z',
  },
};

export const mockRadiologyTestWithMultipleReplaces: ServiceRequest = {
  resourceType: 'ServiceRequest',
  id: 'order-new',
  status: 'active',
  intent: 'order',
  subject: { reference: `Patient/${mockPatientUUID}` },
  code: {
    text: 'Updated X-Ray',
  },
  priority: 'urgent',
  requester: {
    display: 'Dr. Smith',
  },
  occurrencePeriod: {
    start: '2023-10-15T10:30:00.000Z',
  },
  replaces: [
    {
      reference: 'ServiceRequest/order-1',
      type: 'ServiceRequest',
    },
    {
      reference: 'ServiceRequest/order-2',
      type: 'ServiceRequest',
    },
  ],
};

export const mockRadiologyTestWithEmptyReplaces: ServiceRequest = {
  resourceType: 'ServiceRequest',
  id: 'order-1',
  status: 'active',
  intent: 'order',
  subject: { reference: `Patient/${mockPatientUUID}` },
  code: {
    text: 'X-Ray',
  },
  priority: 'urgent',
  requester: {
    display: 'Dr. Smith',
  },
  occurrencePeriod: {
    start: '2023-10-15T10:30:00.000Z',
  },
  replaces: [
    {
      reference: '',
      type: 'ServiceRequest',
    },
  ],
};

// Mock FHIR Bundle
export const mockFhirRadiologyBundle: Bundle = {
  resourceType: 'Bundle',
  id: '6f97eba3-a4be-46fb-b94a-aa00179abce2',
  meta: {
    lastUpdated: '2025-06-13T08:50:36.091+00:00',
  },
  type: 'searchset',
  total: mockFhirRadiologyTests.length,
  link: [
    {
      relation: 'self',
      url: `http://localhost/openmrs/ws/fhir2/R4/ServiceRequest?_count=100&_sort=-_lastUpdated&category=d3561dc0-5e07-11ef-8f7c-0242ac120002&numberOfVisits=5&patient=${mockPatientUUID}`,
    },
  ],
  entry: mockFhirRadiologyTests.map((resource) => ({
    fullUrl: `http://localhost/openmrs/ws/fhir2/R4/ServiceRequest/${resource.id}`,
    resource,
  })),
};

// Mock formatted radiology investigations
export const mockFormattedRadiologyInvestigations: RadiologyInvestigation[] = [
  {
    id: '207172a2-27e3-4fef-bea2-85fb826575e4',
    testName: 'Magnetic resonance imaging of thoracolumbar spine',
    priority: 'routine',
    orderedBy: 'Super Man',
    orderedDate: '2025-06-13T08:48:15+00:00',
    replaces: ['271f2b4f-a239-418b-ba9e-f23014093df3'],
  },
  {
    id: '271f2b4f-a239-418b-ba9e-f23014093df3',
    testName: 'Magnetic resonance imaging of thoracolumbar spine',
    priority: 'routine',
    orderedBy: 'Super Man',
    orderedDate: '2025-06-13T08:47:58+00:00',
  },
  {
    id: '9c847638-295b-4e3e-933d-47d5cad34faf',
    testName: 'X-ray of chest, 2 views and apical lordotic',
    priority: 'routine',
    orderedBy: 'Super Man',
    orderedDate: '2025-06-13T06:24:20+00:00',
  },
];

// Mock test data for utility tests
export const mockRadiologyInvestigationWithReplaces: RadiologyInvestigation = {
  id: '207172a2-27e3-4fef-bea2-85fb826575e4',
  testName: 'MRI - Replacing',
  priority: 'routine',
  orderedBy: 'Dr. Test',
  orderedDate: '2023-01-01',
  replaces: ['271f2b4f-a239-418b-ba9e-f23014093df3'],
};

export const mockRadiologyInvestigationReplaced: RadiologyInvestigation = {
  id: '271f2b4f-a239-418b-ba9e-f23014093df3',
  testName: 'MRI - Replaced',
  priority: 'completed',
  orderedBy: 'Dr. Test',
  orderedDate: '2023-01-01',
};

export const mockRadiologyInvestigationStandalone: RadiologyInvestigation = {
  id: '9c847638-295b-4e3e-933d-47d5cad34faf',
  testName: 'X-Ray - Standalone',
  priority: 'routine',
  orderedBy: 'Dr. Test',
  orderedDate: '2023-01-01',
};

// Complex test scenarios for utility tests
export const mockRadiologyInvestigationsForFiltering: RadiologyInvestigation[] =
  [
    mockRadiologyInvestigationWithReplaces,
    mockRadiologyInvestigationReplaced,
    mockRadiologyInvestigationStandalone,
  ];

export const mockRadiologyInvestigationWithMultipleReplaces: RadiologyInvestigation =
  {
    id: 'replacing-1',
    testName: 'New Combined Order',
    priority: 'stat',
    orderedBy: 'Dr. Test',
    orderedDate: '2023-01-01',
    replaces: ['replaced-1', 'replaced-2'],
  };

// Chain replacement scenario
export const mockRadiologyChainReplacement: RadiologyInvestigation[] = [
  {
    id: 'chain-3',
    testName: 'Third Version',
    priority: 'stat',
    orderedBy: 'Dr. Test',
    orderedDate: '2023-01-01',
    replaces: ['chain-2'],
  },
  {
    id: 'chain-2',
    testName: 'Second Version',
    priority: 'routine',
    orderedBy: 'Dr. Test',
    orderedDate: '2023-01-01',
    replaces: ['chain-1'],
  },
  {
    id: 'chain-1',
    testName: 'First Version',
    priority: 'routine',
    orderedBy: 'Dr. Test',
    orderedDate: '2023-01-01',
  },
  {
    id: 'standalone',
    testName: 'Standalone',
    priority: 'routine',
    orderedBy: 'Dr. Test',
    orderedDate: '2023-01-01',
  },
];

// Helper function to create mock investigations
export const createMockRadiologyInvestigation = (
  id: string,
  testName: string,
  priority: string,
  replaces?: string[],
): RadiologyInvestigation => ({
  id,
  testName,
  priority,
  orderedBy: 'Dr. Test',
  orderedDate: '2023-01-01',
  ...(replaces && replaces.length > 0 && { replaces }),
});
