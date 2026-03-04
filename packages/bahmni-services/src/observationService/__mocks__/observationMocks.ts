import { Observation, Bundle, Encounter } from 'fhir/r4';

export const mockObservation: Observation = {
  resourceType: 'Observation',
  id: 'f001',
  identifier: [
    {
      use: 'official',
      system: 'http://www.bmc.nl/zorgportal/identifiers/observations',
      value: '6323',
    },
  ],
  status: 'final',
  code: {
    coding: [
      {
        system: 'http://loinc.org',
        code: '15074-8',
        display: 'Glucose [Moles/volume] in Blood',
      },
    ],
  },
  subject: {
    reference: 'Patient/f001',
    display: 'P. van de Heuvel',
  },
  effectiveDateTime: '2013-04-02T09:30:10+01:00',
  issued: '2013-04-03T15:30:10+01:00',
  performer: [
    {
      reference: 'Practitioner/f005',
      display: 'A. Langeveld',
    },
  ],
  valueQuantity: {
    value: 6.3,
    unit: 'mmol/l',
    system: 'http://unitsofmeasure.org',
    code: 'mmol/L',
  },
  interpretation: [
    {
      coding: [
        {
          system:
            'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: 'H',
          display: 'High',
        },
      ],
    },
  ],
  referenceRange: [
    {
      low: {
        value: 3.1,
        unit: 'mmol/l',
        system: 'http://unitsofmeasure.org',
        code: 'mmol/L',
      },
      high: {
        value: 6.2,
        unit: 'mmol/l',
        system: 'http://unitsofmeasure.org',
        code: 'mmol/L',
      },
    },
  ],
};

export const mockObservationBundle: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: mockObservation,
    },
  ],
};

export const mockEmptyObservationBundle: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [],
};

export const mockEncounter: Encounter = {
  resourceType: 'Encounter',
  id: '1b5420db-e803-4875-97a1-1636869ebe4d',
  meta: {
    versionId: '1768826158000',
    lastUpdated: '2026-01-19T12:35:58.000+00:00',
  },
  status: 'unknown',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
  subject: {
    reference: 'Patient/2f03d746-038f-4af7-a1c5-c43afb0b5551',
    type: 'Patient',
    display: 'Steffi Maria Graf (Patient Identifier: ABC200000)',
  },
  period: {
    start: '2026-01-19T12:35:58+00:00',
  },
};

export const mockObservationWithEncounter: Observation = {
  resourceType: 'Observation',
  id: '0c0e1991-233a-4c4f-ba26-ee9522dd37fc',
  meta: {
    versionId: '1768826158000',
    lastUpdated: '2026-01-19T12:35:58.000+00:00',
  },
  status: 'final',
  code: {
    coding: [
      {
        code: '5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        display: 'Systolic blood pressure',
      },
    ],
    text: 'Systolic blood pressure',
  },
  subject: {
    reference: 'Patient/2f03d746-038f-4af7-a1c5-c43afb0b5551',
    type: 'Patient',
    display: 'Steffi Maria Graf (Patient Identifier: ABC200000)',
  },
  encounter: {
    reference: 'Encounter/1b5420db-e803-4875-97a1-1636869ebe4d',
    type: 'Encounter',
  },
  effectiveDateTime: '2026-01-19T12:35:58+00:00',
  issued: '2026-01-19T12:35:58.000+00:00',
  valueQuantity: {
    value: 120,
    unit: 'mmHg',
    system: 'http://unitsofmeasure.org',
    code: 'mmHg',
  },
};

export const mockObservationWithEncounterBundle: Bundle<
  Observation | Encounter
> = {
  resourceType: 'Bundle',
  id: '47a14c8d-5949-4a47-9c5d-1ea872fc2a41',
  meta: {
    lastUpdated: '2026-01-19T12:36:04.418+00:00',
  },
  type: 'searchset',
  total: 2,
  entry: [
    {
      fullUrl:
        'http://localhost/openmrs/ws/fhir2/R4/Observation/0c0e1991-233a-4c4f-ba26-ee9522dd37fc',
      resource: mockObservationWithEncounter,
    },
    {
      fullUrl:
        'http://localhost/openmrs/ws/fhir2/R4/Encounter/1b5420db-e803-4875-97a1-1636869ebe4d',
      resource: mockEncounter,
    },
  ],
};
