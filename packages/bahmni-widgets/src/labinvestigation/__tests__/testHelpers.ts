import { ServiceRequest, Bundle, Observation } from 'fhir/r4';
import {
  FormattedLabInvestigations,
  LabInvestigationPriority,
} from '../models';

export const createMockServiceRequest = (
  overrides: Partial<ServiceRequest> = {},
): ServiceRequest => ({
  resourceType: 'ServiceRequest',
  id: 'test-id',
  status: 'completed',
  intent: 'order',
  code: {
    text: 'Test Name',
  },
  subject: {
    reference: 'Patient/test-patient',
  },
  priority: 'routine',
  occurrencePeriod: {
    start: '2025-05-08T12:44:24+00:00',
  },
  requester: {
    display: 'Test Doctor',
  },
  ...overrides,
});

export const createMockBundle = (
  serviceRequests: ServiceRequest[] = [],
  includeFullUrl: boolean = false,
): Bundle<ServiceRequest> => ({
  resourceType: 'Bundle',
  id: 'bundle-id',
  type: 'searchset',
  total: serviceRequests.length,
  entry: serviceRequests.map((resource) => ({
    resource,
    ...(includeFullUrl && {
      fullUrl: `http://example.com/ServiceRequest/${resource.id}`,
    }),
  })),
});

export const createMockObservation = (
  overrides: Partial<Observation> = {},
): Observation =>
  ({
    resourceType: 'Observation',
    id: 'obs-1',
    status: 'final',
    code: { text: 'Test Observation' },
    ...overrides,
  }) as Observation;

export const createMockFormattedLabInvestigation = (
  overrides: Partial<FormattedLabInvestigations> = {},
): FormattedLabInvestigations => ({
  id: 'test-1',
  testName: 'Test Name',
  priority: LabInvestigationPriority.routine,
  orderedBy: 'Dr. Smith',
  orderedDate: '2025-05-08T12:44:24+00:00',
  formattedDate: 'May 08, 2025',
  result: undefined,
  testType: 'Single Test',
  ...overrides,
});

export const LAB_ORDER_PANEL_EXTENSION = [
  {
    url: 'http://fhir.bahmni.org/ext/lab-order-concept-type',
    valueString: 'Panel',
  },
];

export const createConsultationSavedEventPayload = (
  overrides: Record<string, any> = {},
) => ({
  patientUUID: 'patient-123',
  updatedResources: {
    conditions: false,
    allergies: false,
    medications: false,
    serviceRequests: { 'lab order': true },
  },
  ...overrides,
});

export const setupConsultationSavedEventCallback = (
  mockFn: any,
): { eventCallback: any } => {
  const container = { fn: (() => {}) as any };
  mockFn.mockImplementation((callback: any) => {
    container.fn = callback;
  });
  return {
    eventCallback: (payload: any) => container.fn(payload),
  };
};
