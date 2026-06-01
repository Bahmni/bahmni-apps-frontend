import { Bundle } from 'fhir/r4';
import {
  CDSSServerConfig,
  CDSCard,
  CDSHooksResponse,
  CDSSContext,
} from '../models';

export const mockCDSSServerConfig: CDSSServerConfig[] = [
  {
    server: 'test-cdss-server',
    url: 'http://test-cdss.example.com',
    services: [
      {
        name: 'medication-prescribe',
        description: 'Medication prescribing decision support',
        contextResourceMap: [
          { type: 'MedicationRequest', attribute: 'draftOrders' },
          { type: 'Observation', attribute: 'observations' },
        ],
        prefetch: {
          patient: 'Patient/{{context.patientId}}',
        },
      },
      {
        name: 'immunization-forecast',
        description: 'Immunization forecasting',
        contextResourceMap: [
          { type: 'Immunization', attribute: 'immunizations' },
        ],
      },
    ],
  },
  {
    server: 'another-server',
    url: 'http://another-cdss.example.com',
    services: [
      {
        name: 'other-service',
        description: 'Other service',
      },
    ],
  },
];

export const mockCDSCard: CDSCard = {
  summary: 'Drug interaction warning',
  indicator: 'warning',
  source: {
    label: 'Test CDSS',
  },
  suggestions: [
    {
      label: 'Consider alternative medication',
      actions: [
        {
          type: 'update',
          resource: {
            id: 'med-123',
            resourceType: 'MedicationRequest',
            status: 'active',
          },
        },
      ],
    },
  ],
};

export const mockCDSCardCritical: CDSCard = {
  summary: 'Critical allergy alert',
  indicator: 'critical',
  source: {
    label: 'Test CDSS',
  },
  suggestions: [
    {
      label: 'Stop this medication',
      actions: [
        {
          type: 'delete',
          resource: {
            id: 'med-456',
            resourceType: 'MedicationRequest',
          },
        },
      ],
    },
  ],
};

export const mockCDSCardInfo: CDSCard = {
  summary: 'Patient education available',
  indicator: 'info',
  source: {
    label: 'Test CDSS',
  },
};

export const mockCDSCardWithMultipleActions: CDSCard = {
  summary: 'Multiple recommendations',
  indicator: 'warning',
  source: {
    label: 'Test CDSS',
  },
  suggestions: [
    {
      label: 'First suggestion',
      actions: [
        {
          type: 'create',
          resource: {
            id: 'med-789',
            resourceType: 'MedicationRequest',
          },
        },
        {
          type: 'update',
          resource: {
            id: 'med-101',
            resourceType: 'MedicationRequest',
          },
        },
      ],
    },
    {
      label: 'Second suggestion',
      actions: [
        {
          type: 'create',
          resource: {
            id: 'med-102',
            resourceType: 'MedicationRequest',
          },
        },
      ],
    },
  ],
};

export const mockCDSHooksResponse: CDSHooksResponse = {
  cards: [mockCDSCard, mockCDSCardInfo],
};

export const mockEmptyCDSHooksResponse: CDSHooksResponse = {
  cards: [],
};

export const mockCDSSContext: CDSSContext = {
  patientId: 'patient-123',
  visitId: 'visit-456',
  episodeId: 'episode-789',
};

export const mockBundle: Bundle = {
  resourceType: 'Bundle',
  type: 'collection',
  entry: [
    {
      resource: {
        resourceType: 'MedicationRequest',
        id: 'med-123',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-123' },
        medicationCodeableConcept: {
          coding: [{ system: 'test', code: 'test-med', display: 'Test Med' }],
        },
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-456',
        status: 'final',
        code: {
          coding: [{ system: 'test', code: 'test-obs', display: 'Test Obs' }],
        },
        subject: { reference: 'Patient/patient-123' },
      },
    },
    {
      resource: {
        resourceType: 'Immunization',
        id: 'imm-789',
        status: 'completed',
        vaccineCode: {
          coding: [
            { system: 'test', code: 'test-vaccine', display: 'Test Vaccine' },
          ],
        },
        patient: { reference: 'Patient/patient-123' },
        occurrenceDateTime: '2024-01-01',
      },
    },
  ],
};
