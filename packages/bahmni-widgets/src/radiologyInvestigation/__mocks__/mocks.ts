import {
  ServiceRequest,
  Bundle,
  ImagingStudy as FhirImagingStudy,
} from 'fhir/r4';
import { RadiologyInvestigationViewModel, ImagingStudy } from '../models';

export const mockCategoryUuid = 'radiology-uuid-123';

export const mockServiceRequest: ServiceRequest = {
  resourceType: 'ServiceRequest',
  id: 'investigation-1',
  meta: {
    versionId: '1',
    lastUpdated: '2025-06-13T08:48:15.000+00:00',
  },
  status: 'active',
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
  priority: 'stat',
  code: {
    coding: [
      {
        code: '40d1df86-45bd-4925-b831-7015da66d863',
        display: 'Chest X-Ray',
      },
      {
        system: 'http://snomed.info/sct',
        code: '168537006',
      },
    ],
    text: 'Chest X-Ray',
  },
  subject: {
    reference: 'Patient/test-patient-uuid',
    type: 'Patient',
    display: 'John Doe (Patient Identifier: ABC200003)',
  },
  encounter: {
    reference: 'Encounter/89a4fba9-5202-4403-b525-574f7a006819',
    type: 'Encounter',
  },
  occurrencePeriod: {
    start: '2023-12-01T10:30:00.000Z',
    end: '2023-12-01T10:30:00.000Z',
  },
  requester: {
    reference: 'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
    type: 'Practitioner',
    identifier: {
      value: 'drsmith',
    },
    display: 'Dr. Smith',
  },
  note: [
    {
      text: 'Patient should be fasting',
    },
  ],
};

export const mockValidBundle: Bundle<ServiceRequest | FhirImagingStudy> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: mockServiceRequest,
    },
  ],
};

export const mockRadiologyInvestigations: RadiologyInvestigationViewModel[] = [
  {
    id: 'investigation-1',
    testName: 'Chest X-Ray',
    priority: 'stat',
    orderedBy: 'Dr. Smith',
    orderedDate: '2023-12-01T10:30:00.000Z',
    note: 'Patient should be fasting',
  },
  {
    id: 'investigation-2',
    testName: 'CT Scan',
    priority: 'routine',
    orderedBy: 'Dr. Johnson',
    orderedDate: '2023-12-01T14:15:00.000Z',
  },
];

export const createMockRadiologyInvestigation = (
  id: string,
  testName: string,
  priority: string,
  replaces?: string[],
): RadiologyInvestigationViewModel => ({
  id,
  testName,
  priority,
  orderedBy: 'Dr. Test',
  orderedDate: '2023-01-01',
  ...(replaces && replaces.length > 0 && { replaces }),
});

export const mockRadiologyInvestigationsForFiltering: RadiologyInvestigationViewModel[] =
  [
    {
      id: '207172a2-27e3-4fef-bea2-85fb826575e4',
      testName: 'MRI - Replacing',
      priority: 'routine',
      orderedBy: 'Dr. Test',
      orderedDate: '2023-01-01',
      replaces: ['271f2b4f-a239-418b-ba9e-f23014093df3'],
    },
    {
      id: '271f2b4f-a239-418b-ba9e-f23014093df3',
      testName: 'MRI - Replaced',
      priority: 'completed',
      orderedBy: 'Dr. Test',
      orderedDate: '2023-01-01',
    },
    {
      id: '9c847638-295b-4e3e-933d-47d5cad34faf',
      testName: 'X-Ray - Standalone',
      priority: 'routine',
      orderedBy: 'Dr. Test',
      orderedDate: '2023-01-01',
    },
  ];

export const mockRadiologyChainReplacement: RadiologyInvestigationViewModel[] =
  [
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

export const createMockServiceRequestBundle = (
  serviceRequest: ServiceRequest,
): Bundle<ServiceRequest | FhirImagingStudy> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: serviceRequest,
    },
  ],
});

export const createMockServiceRequest = (
  overrides?: Partial<ServiceRequest>,
): ServiceRequest => ({
  resourceType: 'ServiceRequest',
  id: 'order-1',
  status: 'active',
  intent: 'order',
  subject: { reference: 'Patient/123' },
  code: {
    text: 'Chest X-Ray',
  },
  priority: 'stat',
  requester: {
    display: 'Dr. Smith',
  },
  occurrencePeriod: {
    start: '2023-10-15T10:30:00.000Z',
  },
  ...overrides,
});

export const createMockImagingStudy = (
  overrides?: Partial<FhirImagingStudy>,
): FhirImagingStudy => ({
  resourceType: 'ImagingStudy',
  id: 'imaging-1',
  status: 'available',
  subject: { reference: 'Patient/123' },
  basedOn: [{ reference: 'ServiceRequest/order-1' }],
  identifier: [
    {
      system: 'urn:dicom:uid',
      value: '1.2.840.113619.2.55.3.1',
    },
  ],
  ...overrides,
});

export const createMockBundleWithServiceRequestAndImagingStudy = (
  serviceRequest: ServiceRequest,
  imagingStudies: FhirImagingStudy[],
): Bundle<ServiceRequest | FhirImagingStudy> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: serviceRequest,
    },
    ...imagingStudies.map((study) => ({
      resource: study,
    })),
  ],
});

export const mockImagingStudies: ImagingStudy[] = [
  {
    id: 'study-1',
    StudyInstanceUIDs: '1.2.840.113619.2.55.3.1',
    status: 'available',
  },
  {
    id: 'study-2',
    StudyInstanceUIDs: '1.2.840.113619.2.55.3.2',
    status: 'pending',
  },
  {
    id: 'study-3',
    StudyInstanceUIDs: '1.2.840.113619.2.55.3.3',
    status: 'available',
  },
];

export const mockImagingStudiesWithoutAvailable: ImagingStudy[] = [
  {
    id: 'study-1',
    StudyInstanceUIDs: '1.2.840.113619.2.55.3.1',
    status: 'pending',
  },
  {
    id: 'study-2',
    StudyInstanceUIDs: '1.2.840.113619.2.55.3.2',
    status: 'cancelled',
  },
];

export const mockRadiologyInvestigationWithAvailableImagingStudies: RadiologyInvestigationViewModel[] =
  [
    {
      id: 'investigation-1',
      testName: 'Chest X-Ray',
      priority: 'stat',
      orderedBy: 'Dr. Smith',
      orderedDate: '2023-12-01T10:30:00.000Z',
      imagingStudies: [
        {
          id: 'study-1',
          StudyInstanceUIDs: '1.2.840.113619.2.55.3.1',
          status: 'available',
        },
        {
          id: 'study-2',
          StudyInstanceUIDs: '1.2.840.113619.2.55.3.2',
          status: 'available',
        },
      ],
    },
  ];
