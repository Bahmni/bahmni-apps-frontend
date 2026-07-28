import type { Bundle, Task } from 'fhir/r4';

export const mockTaskBundle: Bundle<Task> = {
  resourceType: 'Bundle',
  id: 'task-bundle-1',
  type: 'searchset',
  total: 2,
  entry: [
    {
      fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/Task/task-1',
      resource: {
        resourceType: 'Task',
        id: 'task-1',
        status: 'requested',
        intent: 'order',
        code: {
          text: 'Vitals Form',
          coding: [
            {
              system: 'http://example.org/task-codes',
              code: 'vitals-form',
              display: 'Vitals Form',
            },
          ],
        },
        for: {
          reference: 'Patient/patient-uuid-1',
          display: 'Test Patient',
        },
        authoredOn: '2025-03-25T10:00:00Z',
        lastModified: '2025-03-25T10:00:00Z',
      },
    },
    {
      fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/Task/task-2',
      resource: {
        resourceType: 'Task',
        id: 'task-2',
        status: 'completed',
        intent: 'order',
        code: {
          text: 'Physical Exam',
          coding: [
            {
              system: 'http://example.org/task-codes',
              code: 'physical-exam',
              display: 'Physical Exam',
            },
          ],
        },
        for: {
          reference: 'Patient/patient-uuid-1',
          display: 'Test Patient',
        },
        owner: {
          reference: 'Practitioner/practitioner-1',
          display: 'Dr. Smith',
        },
        authoredOn: '2025-03-24T10:00:00Z',
        lastModified: '2025-03-25T11:00:00Z',
      },
    },
  ],
};

export const emptyTaskBundle: Bundle<Task> = {
  resourceType: 'Bundle',
  id: 'empty-bundle',
  type: 'searchset',
  total: 0,
};
