import { FhirDiagnosis, DiagnosisCertainty } from '@/types/diagnosis';

export const mockFhirDiagnoses: FhirDiagnosis[] = [
  {
    resourceType: 'Condition',
    id: 'diagnosis-1',
    meta: {
      versionId: '1',
      lastUpdated: '2025-01-15T10:30:00Z',
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
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed',
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'encounter-diagnosis',
            display: 'Encounter Diagnosis',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '44054006',
          display: 'Diabetes mellitus type 2',
        },
      ],
      text: 'Type 2 Diabetes Mellitus',
    },
    subject: {
      reference: 'Patient/patient-1',
      type: 'Patient',
      display: 'John Doe',
    },
    encounter: {
      reference: 'Encounter/encounter-1',
      type: 'Encounter',
    },
    recordedDate: '2025-01-15T10:30:00Z',
    recorder: {
      reference: 'Practitioner/practitioner-1',
      type: 'Practitioner',
      display: 'Dr. Jane Smith',
    },
  },
  {
    resourceType: 'Condition',
    id: 'diagnosis-2',
    meta: {
      versionId: '1',
      lastUpdated: '2025-01-15T10:35:00Z',
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
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'provisional',
          display: 'Provisional',
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'encounter-diagnosis',
            display: 'Encounter Diagnosis',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '38341003',
          display: 'Hypertension',
        },
      ],
      text: 'Hypertension',
    },
    subject: {
      reference: 'Patient/patient-1',
      type: 'Patient',
      display: 'John Doe',
    },
    encounter: {
      reference: 'Encounter/encounter-1',
      type: 'Encounter',
    },
    recordedDate: '2025-01-15T10:35:00Z',
    recorder: {
      reference: 'Practitioner/practitioner-1',
      type: 'Practitioner',
      display: 'Dr. Jane Smith',
    },
  },
  {
    resourceType: 'Condition',
    id: 'diagnosis-3',
    meta: {
      versionId: '1',
      lastUpdated: '2025-01-10T14:20:00Z',
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
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed',
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'encounter-diagnosis',
            display: 'Encounter Diagnosis',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '195967001',
          display: 'Asthma',
        },
      ],
      text: 'Asthma',
    },
    subject: {
      reference: 'Patient/patient-1',
      type: 'Patient',
      display: 'John Doe',
    },
    encounter: {
      reference: 'Encounter/encounter-2',
      type: 'Encounter',
    },
    recordedDate: '2025-01-10T14:20:00Z',
    recorder: {
      reference: 'Practitioner/practitioner-2',
      type: 'Practitioner',
      display: 'Dr. Robert Johnson',
    },
  },
];

export const mockFormattedDiagnoses = [
  {
    id: 'diagnosis-1',
    display: 'Type 2 Diabetes Mellitus',
    certainty: DiagnosisCertainty.Confirmed,
    recordedDate: '2025-01-15T10:30:00Z',
    formattedDate: 'Jan 15, 2025',
    recorder: 'Dr. Jane Smith',
  },
  {
    id: 'diagnosis-2',
    display: 'Hypertension',
    certainty: DiagnosisCertainty.Provisional,
    recordedDate: '2025-01-15T10:35:00Z',
    formattedDate: 'Jan 15, 2025',
    recorder: 'Dr. Jane Smith',
  },
  {
    id: 'diagnosis-3',
    display: 'Asthma',
    certainty: DiagnosisCertainty.Confirmed,
    recordedDate: '2025-01-10T14:20:00Z',
    formattedDate: 'Jan 10, 2025',
    recorder: 'Dr. Robert Johnson',
  },
];

export const mockDiagnosesByDate = [
  {
    date: 'Jan 15, 2025',
    rawDate: '2025-01-15T10:30:00Z',
    diagnoses: [
      {
        id: 'diagnosis-1',
        display: 'Type 2 Diabetes Mellitus',
        certainty: DiagnosisCertainty.Confirmed,
        recordedDate: '2025-01-15T10:30:00Z',
        formattedDate: 'Jan 15, 2025',
        recorder: 'Dr. Jane Smith',
      },
      {
        id: 'diagnosis-2',
        display: 'Hypertension',
        certainty: DiagnosisCertainty.Provisional,
        recordedDate: '2025-01-15T10:35:00Z',
        formattedDate: 'Jan 15, 2025',
        recorder: 'Dr. Jane Smith',
      },
    ],
  },
  {
    date: 'Jan 10, 2025',
    rawDate: '2025-01-10T14:20:00Z',
    diagnoses: [
      {
        id: 'diagnosis-3',
        display: 'Asthma',
        certainty: DiagnosisCertainty.Confirmed,
        recordedDate: '2025-01-10T14:20:00Z',
        formattedDate: 'Jan 10, 2025',
        recorder: 'Dr. Robert Johnson',
      },
    ],
  },
];
