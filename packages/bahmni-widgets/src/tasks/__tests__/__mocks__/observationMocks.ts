import type { Observation, Encounter, Bundle } from 'fhir/r4';

export const mockObservationWithFormPath: Observation = {
  resourceType: 'Observation',
  id: 'obs-1',
  status: 'final',
  code: {
    coding: [
      {
        code: '5087AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        display: 'Pulse',
      },
    ],
    text: 'Pulse',
  },
  subject: {
    reference: 'Patient/patient-uuid',
  },
  encounter: {
    reference: 'Encounter/encounter-1',
  },
  effectiveDateTime: '2026-07-20T09:59:41+00:00',
  valueQuantity: {
    value: 76,
    unit: 'beats/min',
  },
  extension: [
    {
      url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
      valueString: 'Bahmni^Vitals (6 years or older).1/17-0',
    },
  ],
};

export const mockObservationWithoutFormPath: Observation = {
  resourceType: 'Observation',
  id: 'obs-2',
  status: 'final',
  code: {
    coding: [
      {
        code: '5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        display: 'Weight (kg)',
      },
    ],
    text: 'Weight (kg)',
  },
  subject: {
    reference: 'Patient/patient-uuid',
  },
  encounter: {
    reference: 'Encounter/encounter-1',
  },
  effectiveDateTime: '2026-07-20T09:59:41+00:00',
  valueQuantity: {
    value: 5.0,
    unit: 'kg',
  },
};

export const mockObservationForPregnancy: Observation = {
  resourceType: 'Observation',
  id: 'obs-pregnancy-1',
  status: 'final',
  code: {
    coding: [
      {
        code: 'pregnancy-code',
        display: 'Pregnancy Status',
      },
    ],
    text: 'Pregnancy Status',
  },
  subject: {
    reference: 'Patient/patient-uuid',
  },
  encounter: {
    reference: 'Encounter/encounter-2',
  },
  effectiveDateTime: '2026-07-20T10:00:00+00:00',
  valueCodeableConcept: {
    coding: [
      {
        code: 'positive',
        display: 'Positive',
      },
    ],
  },
  extension: [
    {
      url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
      valueString: 'Bahmni^Pregnancy Declaration.1/5-0',
    },
  ],
};

export const mockObservationsForVitals: Observation[] = [
  mockObservationWithFormPath,
  {
    ...mockObservationWithFormPath,
    id: 'obs-vitals-2',
    code: {
      coding: [
        {
          code: '5090AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Height (cm)',
        },
      ],
      text: 'Height (cm)',
    },
    valueQuantity: {
      value: 12.0,
      unit: 'cm',
    },
    extension: [
      {
        url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
        valueString: 'Bahmni^Vitals (6 years or older).1/10-0',
      },
    ],
  },
];

export const mockObservationsBundle: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 2,
  entry: [
    {
      fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/Observation/obs-1',
      resource: mockObservationWithFormPath,
    },
    {
      fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/Observation/obs-vitals-2',
      resource: mockObservationsForVitals[1],
    },
  ],
};

export const mockEmptyObservationsBundle: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 0,
  entry: [],
};

export const mockEncounterWithProvider: Encounter = {
  resourceType: 'Encounter',
  id: 'encounter-1',
  status: 'unknown',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
  subject: {
    reference: 'Patient/patient-uuid',
  },
  participant: [
    {
      individual: {
        reference: 'Practitioner/60b31d2a-1d0c-11f1-b099-5a3ed7acdb7e',
        type: 'Practitioner',
        display: 'Super Man',
      },
    },
  ],
  period: {
    start: '2026-07-20T09:59:41+00:00',
  },
};

export const mockEncounterWithoutProvider: Encounter = {
  resourceType: 'Encounter',
  id: 'encounter-2',
  status: 'unknown',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
  subject: {
    reference: 'Patient/patient-uuid',
  },
  participant: [],
  period: {
    start: '2026-07-20T10:00:00+00:00',
  },
};

export const mockEncounterWithoutPeriodStart: Encounter = {
  resourceType: 'Encounter',
  id: 'encounter-3',
  status: 'unknown',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
  subject: {
    reference: 'Patient/patient-uuid',
  },
  participant: [
    {
      individual: {
        reference: 'Practitioner/another-practitioner',
        type: 'Practitioner',
        display: 'Dr. Smith',
      },
    },
  ],
  period: {},
};

export const mockEncountersBundle: Bundle<Encounter> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 1,
  entry: [
    {
      fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/Encounter/encounter-1',
      resource: mockEncounterWithProvider,
    },
  ],
};

export const mockObservationAndEncounterBundle: Bundle<
  Observation | Encounter
> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 3,
  entry: [
    {
      fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/Observation/obs-1',
      resource: mockObservationWithFormPath,
    },
    {
      fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/Observation/obs-vitals-2',
      resource: mockObservationsForVitals[1],
    },
    {
      fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/Encounter/encounter-1',
      resource: mockEncounterWithProvider,
    },
  ],
};

export const mockEncounterGroups = [
  {
    encounterUuid: 'encounter-1',
    encounterDateTime: new Date('2026-07-20T09:59:41+00:00').getTime(),
    providerName: 'Super Man',
    observations: mockObservationsForVitals,
  },
  {
    encounterUuid: 'encounter-2',
    encounterDateTime: new Date('2026-07-20T10:00:00+00:00').getTime(),
    providerName: 'Unknown',
    observations: [mockObservationForPregnancy],
  },
];
