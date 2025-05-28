import {
  FhirLabTest,
  FhirLabTestBundle,
  FormattedLabTest,
  LabTestStatus,
  LabTestPriority,
  LabTestsByDate,
} from '@/types/labInvestigation';

// Mock patient UUID
export const mockPatientUUID = 'test-patient-uuid';

// Mock FHIR lab tests
export const mockFhirLabTests: FhirLabTest[] = [
  {
    resourceType: 'ServiceRequest',
    id: 'lab-test-1',
    meta: {
      versionId: '1',
      lastUpdated: '2025-03-25T06:48:32.000+00:00',
    },
    text: {
      status: 'generated',
      div: '<div>Complete Blood Count</div>',
    },
    extension: [
      {
        url: 'http://fhir.bahmni.org/lab-order-concept-type-extension',
        valueString: 'Panel',
      },
    ],
    status: 'Pending',
    intent: 'order',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/service-category',
            code: 'lab',
            display: 'Laboratory',
          },
        ],
        text: 'Laboratory',
      },
    ],
    priority: 'Routine',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '58410-2',
          display:
            'Complete blood count (CBC) panel - Blood by Automated count',
        },
      ],
      text: 'Complete Blood Count',
    },
    subject: {
      reference: `Patient/${mockPatientUUID}`,
      type: 'Patient',
      display: 'Test Patient',
    },
    encounter: {
      reference: 'Encounter/test-encounter',
      type: 'Encounter',
    },
    occurrencePeriod: {
      start: '2025-03-25T06:48:32.000+00:00',
      end: '2025-03-25T06:48:32.000+00:00',
    },
    requester: {
      reference: 'Practitioner/test-practitioner',
      type: 'Practitioner',
      identifier: {
        value: 'test-practitioner',
      },
      display: 'Dr. John Doe',
    },
  },
  {
    resourceType: 'ServiceRequest',
    id: 'lab-test-2',
    meta: {
      versionId: '1',
      lastUpdated: '2025-03-25T06:48:32.000+00:00',
    },
    text: {
      status: 'generated',
      div: '<div>Lipid Panel</div>',
    },
    extension: [
      {
        url: 'http://fhir.bahmni.org/lab-order-concept-type-extension',
        valueString: 'Panel',
      },
    ],
    status: 'Pending',
    intent: 'order',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/service-category',
            code: 'lab',
            display: 'Laboratory',
          },
        ],
        text: 'Laboratory',
      },
    ],
    priority: 'Stat',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '24331-1',
          display: 'Lipid Panel',
        },
      ],
      text: 'Lipid Panel',
    },
    subject: {
      reference: `Patient/${mockPatientUUID}`,
      type: 'Patient',
      display: 'Test Patient',
    },
    encounter: {
      reference: 'Encounter/test-encounter',
      type: 'Encounter',
    },
    occurrencePeriod: {
      start: '2025-03-25T06:48:32.000+00:00',
      end: '2025-03-25T06:48:32.000+00:00',
    },
    requester: {
      reference: 'Practitioner/test-practitioner',
      type: 'Practitioner',
      identifier: {
        value: 'test-practitioner',
      },
      display: 'Dr. Jane Smith',
    },
  },
  {
    resourceType: 'ServiceRequest',
    id: 'lab-test-3',
    meta: {
      versionId: '1',
      lastUpdated: '2025-03-24T06:48:32.000+00:00',
    },
    text: {
      status: 'generated',
      div: '<div>Glucose Test</div>',
    },
    extension: [
      {
        url: 'http://fhir.bahmni.org/lab-order-concept-type-extension',
        valueString: 'Test',
      },
    ],
    status: 'Pending',
    intent: 'order',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/service-category',
            code: 'lab',
            display: 'Laboratory',
          },
        ],
        text: 'Laboratory',
      },
    ],
    priority: 'Routine',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '2339-0',
          display: 'Glucose',
        },
      ],
      text: 'Glucose Test',
    },
    subject: {
      reference: `Patient/${mockPatientUUID}`,
      type: 'Patient',
      display: 'Test Patient',
    },
    encounter: {
      reference: 'Encounter/test-encounter',
      type: 'Encounter',
    },
    occurrencePeriod: {
      start: '2025-03-24T06:48:32.000+00:00',
      end: '2025-03-24T06:48:32.000+00:00',
    },
    requester: {
      reference: 'Practitioner/test-practitioner',
      type: 'Practitioner',
      identifier: {
        value: 'test-practitioner',
      },
      display: 'Dr. John Doe',
    },
  },
];

// Mock FHIR lab test bundle
export const mockFhirLabTestBundle: FhirLabTestBundle = {
  resourceType: 'Bundle',
  id: 'test-bundle',
  meta: {
    lastUpdated: '2025-03-25T06:48:32.000+00:00',
  },
  type: 'searchset',
  total: mockFhirLabTests.length,
  link: [
    {
      relation: 'self',
      url: `https://example.org/fhir/ServiceRequest?patient=${mockPatientUUID}`,
    },
  ],
  entry: mockFhirLabTests.map((resource) => ({
    fullUrl: `https://example.org/fhir/ServiceRequest/${resource.id}`,
    resource,
  })),
};

// Mock formatted lab tests
export const mockFormattedLabTests: FormattedLabTest[] = [
  {
    id: 'lab-test-1',
    testName: 'Complete Blood Count',
    status: LabTestStatus.Pending,
    priority: LabTestPriority.routine,
    orderedBy: 'Dr. John Doe',
    orderedDate: '2025-03-25T06:48:32.000+00:00',
    formattedDate: 'Mar 25, 2025',
    testType: 'Panel',
  },
  {
    id: 'lab-test-2',
    testName: 'Lipid Panel',
    status: LabTestStatus.Pending,
    priority: LabTestPriority.stat,
    orderedBy: 'Dr. Jane Smith',
    orderedDate: '2025-03-25T06:48:32.000+00:00',
    formattedDate: 'Mar 25, 2025',
    testType: 'Panel',
  },
  {
    id: 'lab-test-3',
    testName: 'Glucose Test',
    status: LabTestStatus.Pending,
    priority: LabTestPriority.routine,
    orderedBy: 'Dr. John Doe',
    orderedDate: '2025-03-24T06:48:32.000+00:00',
    formattedDate: 'Mar 24, 2025',
    testType: 'Single Test',
  },
];

// Mock lab tests grouped by date
export const mockLabTestsByDate: LabTestsByDate[] = [
  {
    date: 'Mar 25, 2025',
    rawDate: '2025-03-25T06:48:32.000+00:00',
    tests: [mockFormattedLabTests[0], mockFormattedLabTests[1]],
  },
  {
    date: 'Mar 24, 2025',
    rawDate: '2025-03-24T06:48:32.000+00:00',
    tests: [mockFormattedLabTests[2]],
  },
];

// Mock lab test with missing optional fields
export const mockLabTestWithMissingFields: FhirLabTest = {
  resourceType: 'ServiceRequest',
  id: 'lab-test-incomplete',
  meta: {
    versionId: '1',
    lastUpdated: '2025-03-25T06:48:32.000+00:00',
  },
  extension: [
    {
      url: 'http://fhir.bahmni.org/lab-order-concept-type-extension',
      valueString: 'Test',
    },
  ],
  status: 'Pending',
  intent: 'order',
  category: [
    {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/service-category',
          code: 'lab',
          display: 'Laboratory',
        },
      ],
      text: 'Laboratory',
    },
  ],
  priority: 'Routine',
  code: {
    coding: [
      {
        code: 'incomplete-test',
      },
    ],
    text: 'Incomplete Test',
  },
  subject: {
    reference: `Patient/${mockPatientUUID}`,
    type: 'Patient',
    display: 'Test Patient',
  },
  encounter: {
    reference: 'Encounter/test-encounter',
    type: 'Encounter',
  },
  occurrencePeriod: {
    start: '2025-03-25T06:48:32.000+00:00',
    end: '2025-03-25T06:48:32.000+00:00',
  },
  requester: {
    reference: 'Practitioner/test-practitioner',
    type: 'Practitioner',
    display: 'Unknown Doctor',
  },
};

// Mock formatted lab test with missing fields
export const mockFormattedLabTestWithMissingFields: FormattedLabTest = {
  id: 'lab-test-incomplete',
  testName: 'Incomplete Test',
  status: LabTestStatus.Pending,
  priority: LabTestPriority.routine,
  orderedBy: 'Unknown Doctor',
  orderedDate: '2025-03-25T06:48:32.000+00:00',
  formattedDate: 'Mar 25, 2025',
  testType: 'Single Test',
};

// Mock lab tests by date with incomplete test
export const mockLabTestsByDateWithIncomplete: LabTestsByDate[] = [
  {
    date: 'Mar 25, 2025',
    rawDate: '2025-03-25T06:48:32.000+00:00',
    tests: [mockFormattedLabTestWithMissingFields],
  },
];
