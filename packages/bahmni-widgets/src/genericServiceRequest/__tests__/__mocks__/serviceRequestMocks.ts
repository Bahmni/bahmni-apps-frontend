import { Bundle, ServiceRequest } from 'fhir/r4';
import { ServiceRequestViewModel } from '../../models';

export const mockOrderTypes = {
  results: [
    {
      uuid: 'lab-uuid',
      display: 'Lab Order',
      conceptClasses: [
        {
          uuid: 'concept-class-1',
          name: 'Test',
        },
      ],
    },
    {
      uuid: 'radiology-uuid',
      display: 'Radiology Order',
      conceptClasses: [
        {
          uuid: 'concept-class-2',
          name: 'Radiology',
        },
      ],
    },
  ],
};

export const mockServiceRequestBundle: Bundle<ServiceRequest> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'ServiceRequest',
        id: 'service-1',
        status: 'active',
        intent: 'order',
        code: { text: 'Blood Test' },
        priority: 'stat',
        subject: { reference: 'Patient/patient-123' },
        requester: { display: 'Dr. Smith' },
        occurrencePeriod: { start: '2023-12-01T10:30:00.000Z' },
      },
    },
    {
      resource: {
        resourceType: 'ServiceRequest',
        id: 'service-2',
        status: 'active',
        intent: 'order',
        code: { text: 'Urine Test' },
        priority: 'routine',
        subject: { reference: 'Patient/patient-123' },
        requester: { display: 'Dr. Johnson' },
        occurrencePeriod: { start: '2023-12-01T14:15:00.000Z' },
      },
    },
    {
      resource: {
        resourceType: 'ServiceRequest',
        id: 'service-3',
        status: 'active',
        intent: 'order',
        code: { text: 'Liver Function Test' },
        priority: 'stat',
        subject: { reference: 'Patient/patient-123' },
        requester: { display: 'Dr. Brown' },
        occurrencePeriod: { start: '2023-11-30T09:00:00.000Z' },
      },
    },
  ],
};

export const mockServiceRequests: ServiceRequestViewModel[] = [
  {
    id: 'service-1',
    testName: 'Blood Test',
    priority: 'stat',
    orderedBy: 'Dr. Smith',
    orderedDate: '2023-12-01T10:30:00.000Z',
    status: 'active',
  },
  {
    id: 'service-2',
    testName: 'Urine Test',
    priority: 'routine',
    orderedBy: 'Dr. Johnson',
    orderedDate: '2023-12-01T14:15:00.000Z',
    status: 'active',
  },
  {
    id: 'service-3',
    testName: 'Liver Function Test',
    priority: 'stat',
    orderedBy: 'Dr. Brown',
    orderedDate: '2023-11-30T09:00:00.000Z',
    status: 'active',
  },
];
