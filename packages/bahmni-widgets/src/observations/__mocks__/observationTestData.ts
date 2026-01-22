import { Bundle, Observation, Encounter } from 'fhir/r4';

export const mockBundleWithCorrectValues: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Systolic blood pressure',
          coding: [{ code: '5085', display: 'Systolic blood pressure' }],
        },
        valueQuantity: {
          value: 120,
          unit: 'mmHg',
        },
        effectiveDateTime: '2026-01-19T12:35:58+00:00',
        extension: [
          {
            url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
            valueString: 'Bahmni^Vitals.1/10-0',
          },
        ],
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-2',
        status: 'final',
        code: {
          text: 'Chief Complaint Duration',
        },
        valueCodeableConcept: {
          text: 'Days',
          coding: [{ code: '1072', display: 'Days' }],
        },
        extension: [
          {
            url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
            valueString: 'Bahmni^Registration Details.2/25-1',
          },
        ],
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-3',
        status: 'final',
        code: {
          text: 'Chief Complaint Record',
        },
        valueString: 'Fever, 2.0, Days',
      },
    },
  ],
};

export const mockEmptyBundle: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [],
};

export const mockBundleWithNoEntries: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
};

export const mockBundleWithEncounterDetails: Bundle<Observation | Encounter> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Encounter',
        id: 'enc-1',
        status: 'finished',
        class: { code: 'AMB' },
        type: [{ coding: [{ display: 'Consultation' }] }],
        period: { start: '2026-01-19T10:00:00+00:00' },
        participant: [{ individual: { display: 'Dr. Smith' } }],
        location: [{ location: { display: 'OPD' } }],
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Temperature' },
        valueQuantity: { value: 98.6, unit: 'F' },
        encounter: { reference: 'Encounter/enc-1' },
      },
    },
  ],
};

export const mockBundleWithHasMember: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Observation',
        id: 'child-1',
        status: 'final',
        code: { text: 'Systolic' },
        valueQuantity: { value: 120, unit: 'mmHg' },
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'parent-1',
        status: 'final',
        code: { text: 'Blood Pressure' },
        hasMember: [{ reference: 'Observation/child-1' }],
      },
    },
  ],
};

export const mockBundleWithoutValueType: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Notes' },
      },
    },
  ],
};

export const mockBundleWithMissingOptionalFields: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { coding: [{ display: 'Lab Test' }] },
        valueCodeableConcept: {
          coding: [{ display: 'Positive' }],
        },
      },
    },
  ],
};

export const mockBundleWithAllOptionalValues: Bundle<Observation | Encounter> =
  {
    resourceType: 'Bundle',
    type: 'searchset',
    entry: [
      {
        resource: {
          resourceType: 'Encounter',
          status: 'finished',
          class: { code: 'AMB' },
          type: [],
          period: {},
          participant: [],
          location: [],
        },
      },
      {
        resource: {
          resourceType: 'Encounter',
          id: 'enc-minimal',
          status: 'finished',
          class: { code: 'AMB' },
          type: [],
          period: {},
          participant: [],
          location: [],
        },
      },
      {
        resource: {
          resourceType: 'Observation',
          id: 'obs-with-string-ref',
          status: 'final',
          code: {},
          valueQuantity: {},
          encounter: { reference: 'Encounter/enc-minimal' },
        },
      },
      {
        resource: {
          resourceType: 'Observation',
          id: 'obs-parent',
          status: 'final',
          code: {},
          hasMember: [
            { reference: 'Observation/obs-child-valid' },
            { reference: 'Observation/non-existent' },
          ],
        },
      },
      {
        resource: {
          resourceType: 'Observation',
          id: 'obs-child-valid',
          status: 'final',
          code: {},
        },
      },
      {
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: {},
        },
      },
    ],
  };

export const mockBundleWithMultipleEncounters: Bundle<Observation | Encounter> =
  {
    resourceType: 'Bundle',
    type: 'searchset',
    entry: [
      {
        resource: {
          resourceType: 'Encounter',
          id: 'enc-1',
          status: 'finished',
          class: { code: 'AMB' },
          period: { start: '2026-01-19T10:00:00+00:00' },
        },
      },
      {
        resource: {
          resourceType: 'Encounter',
          id: 'enc-2',
          status: 'finished',
          class: { code: 'AMB' },
          period: { start: '2026-01-20T14:30:00+00:00' },
        },
      },
      {
        resource: {
          resourceType: 'Observation',
          id: 'obs-1',
          status: 'final',
          code: { text: 'Temperature' },
          encounter: { reference: 'Encounter/enc-1' },
        },
      },
      {
        resource: {
          resourceType: 'Observation',
          id: 'obs-2',
          status: 'final',
          code: { text: 'Blood Pressure' },
          encounter: { reference: 'Encounter/enc-1' },
        },
      },
      {
        resource: {
          resourceType: 'Observation',
          id: 'obs-3',
          status: 'final',
          code: { text: 'Weight' },
          encounter: { reference: 'Encounter/enc-2' },
        },
      },
    ],
  };

export const mockBundleWithMixedObservations: Bundle<Observation | Encounter> =
  {
    resourceType: 'Bundle',
    type: 'searchset',
    entry: [
      {
        resource: {
          resourceType: 'Encounter',
          id: 'enc-1',
          status: 'finished',
          class: { code: 'AMB' },
          period: { start: '2026-01-19T10:00:00+00:00' },
        },
      },
      {
        resource: {
          resourceType: 'Observation',
          id: 'obs-single',
          status: 'final',
          code: { text: 'Temperature' },
          encounter: { reference: 'Encounter/enc-1' },
          extension: [
            {
              url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
              valueString: 'Bahmni^Vitals.1/10-0',
            },
          ],
        },
      },
      {
        resource: {
          resourceType: 'Observation',
          id: 'obs-child-1',
          status: 'final',
          code: { text: 'Systolic' },
          extension: [
            {
              url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
              valueString: 'Bahmni^Lab Results.2/20-0',
            },
          ],
        },
      },
      {
        resource: {
          resourceType: 'Observation',
          id: 'obs-parent',
          status: 'final',
          code: { text: 'Blood Pressure' },
          hasMember: [{ reference: 'Observation/obs-child-1' }],
          encounter: { reference: 'Encounter/enc-1' },
          extension: [
            {
              url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
              valueString: 'Bahmni^Lab Results.2/19-0',
            },
          ],
        },
      },
    ],
  };

export const mockBundleWithGroupedObservationsOnly: Bundle<
  Observation | Encounter
> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Encounter',
        id: 'enc-1',
        status: 'finished',
        class: { code: 'AMB' },
        period: { start: '2026-01-18T10:00:00+00:00' },
      },
    },
    {
      resource: {
        resourceType: 'Encounter',
        id: 'enc-2',
        status: 'finished',
        class: { code: 'AMB' },
        period: { start: '2026-01-20T14:30:00+00:00' },
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-child-1',
        status: 'final',
        code: { text: 'Systolic' },
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-parent-1',
        status: 'final',
        code: { text: 'Blood Pressure' },
        hasMember: [{ reference: 'Observation/obs-child-1' }],
        encounter: { reference: 'Encounter/enc-1' },
        extension: [
          {
            url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
            valueString: 'Bahmni^Vitals.1/10-0',
          },
        ],
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-child-2',
        status: 'final',
        code: { text: 'Diastolic' },
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-parent-2',
        status: 'final',
        code: { text: 'Vitals' },
        hasMember: [{ reference: 'Observation/obs-child-2' }],
        encounter: { reference: 'Encounter/enc-2' },
        extension: [
          {
            url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
            valueString: 'Bahmni^Lab Results.2/20-0',
          },
        ],
      },
    },
  ],
};

export const mockBundleWithOneMissingDate: Bundle<Observation | Encounter> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Encounter',
        id: 'enc-1',
        status: 'finished',
        class: { code: 'AMB' },
        period: { start: '2026-01-19T10:00:00+00:00' },
      },
    },
    {
      resource: {
        resourceType: 'Encounter',
        id: 'enc-2',
        status: 'finished',
        class: { code: 'AMB' },
        period: {},
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Temperature' },
        encounter: { reference: 'Encounter/enc-1' },
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-2',
        status: 'final',
        code: { text: 'Weight' },
        encounter: { reference: 'Encounter/enc-2' },
      },
    },
  ],
};

export const mockBundleWithBothMissingDates: Bundle<Observation | Encounter> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Encounter',
        id: 'enc-3',
        status: 'finished',
        class: { code: 'AMB' },
        period: {},
      },
    },
    {
      resource: {
        resourceType: 'Encounter',
        id: 'enc-4',
        status: 'finished',
        class: { code: 'AMB' },
        period: {},
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-3',
        status: 'final',
        code: { text: 'Heart Rate' },
        encounter: { reference: 'Encounter/enc-3' },
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-4',
        status: 'final',
        code: { text: 'Pulse' },
        encounter: { reference: 'Encounter/enc-4' },
      },
    },
  ],
};

export const mockBundleWithReversedMissingDate: Bundle<
  Observation | Encounter
> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Encounter',
        id: 'enc-5',
        status: 'finished',
        class: { code: 'AMB' },
        period: {},
      },
    },
    {
      resource: {
        resourceType: 'Encounter',
        id: 'enc-6',
        status: 'finished',
        class: { code: 'AMB' },
        period: { start: '2026-01-19T10:00:00+00:00' },
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-5',
        status: 'final',
        code: { text: 'BP' },
        encounter: { reference: 'Encounter/enc-5' },
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-6',
        status: 'final',
        code: { text: 'Temp' },
        encounter: { reference: 'Encounter/enc-6' },
      },
    },
  ],
};

export const mockBundleWithNormalReferenceRange: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-with-normal-range',
        status: 'final',
        code: { text: 'Glucose Level' },
        valueQuantity: {
          value: 95,
          unit: 'mg/dL',
        },
        referenceRange: [
          {
            low: { value: 50, unit: 'mg/dL' },
            high: { value: 100, unit: 'mg/dL' },
            type: {
              coding: [
                {
                  system: 'http://example.com/other-system',
                  code: 'critical',
                },
              ],
            },
          },
          {
            low: { value: 70, unit: 'mg/dL' },
            high: { value: 100, unit: 'mg/dL' },
            type: {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                  code: 'normal',
                },
              ],
            },
          },
          {
            low: { value: 60, unit: 'mg/dL' },
            high: { value: 110, unit: 'mg/dL' },
            type: {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                  code: 'therapeutic',
                },
              ],
            },
          },
        ],
        interpretation: [
          {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: 'N',
                display: 'Normal',
              },
            ],
            text: 'Normal',
          },
        ],
      },
    },
  ],
};

export const mockBundleWithOnlyFirstReferenceRange: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-without-normal-range',
        status: 'final',
        code: { text: 'Potassium' },
        valueQuantity: {
          value: 4.5,
          unit: 'mEq/L',
        },
        referenceRange: [
          {
            low: { value: 3.5, unit: 'mEq/L' },
            high: { value: 5.5, unit: 'mEq/L' },
            type: {
              coding: [
                {
                  system: 'http://example.com/other-system',
                  code: 'normal',
                },
              ],
            },
          },
          {
            low: { value: 4.0, unit: 'mEq/L' },
            high: { value: 5.0, unit: 'mEq/L' },
            type: {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                  code: 'therapeutic',
                },
              ],
            },
          },
        ],
        interpretation: [
          {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: 'A',
                display: 'Abnormal',
              },
            ],
            text: 'Abnormal',
          },
        ],
      },
    },
  ],
};

export const mockObservationWithBothRangesHavingUnits = {
  id: 'obs-1',
  display: 'Blood Glucose',
  observationValue: {
    value: 95,
    unit: 'mg/dL',
    type: 'quantity' as const,
    referenceRange: {
      low: { value: 70, unit: 'mg/dL' },
      high: { value: 100, unit: 'mg/dL' },
    },
  },
};

export const mockObservationWithBothRangesUsingObsUnit = {
  id: 'obs-2',
  display: 'Hemoglobin',
  observationValue: {
    value: 14,
    unit: 'g/dL',
    type: 'quantity' as const,
    referenceRange: {
      low: { value: 12 },
      high: { value: 16 },
    },
  },
};

export const mockObservationWithMixedUnits = {
  id: 'obs-3',
  display: 'Temperature',
  observationValue: {
    value: 98.6,
    unit: '°F',
    type: 'quantity' as const,
    referenceRange: {
      low: { value: 97, unit: '°F' },
      high: { value: 99 },
    },
  },
};

export const mockObservationWithOnlyLowWithUnit = {
  id: 'obs-4',
  display: 'Systolic BP',
  observationValue: {
    value: 130,
    unit: 'mmHg',
    type: 'quantity' as const,
    referenceRange: {
      low: { value: 90, unit: 'mmHg' },
    },
  },
};

export const mockObservationWithOnlyLowUsingObsUnit = {
  id: 'obs-5',
  display: 'Heart Rate',
  observationValue: {
    value: 75,
    unit: 'bpm',
    type: 'quantity' as const,
    referenceRange: {
      low: { value: 60 },
    },
  },
};

export const mockObservationWithOnlyHighWithUnit = {
  id: 'obs-6',
  display: 'Cholesterol',
  observationValue: {
    value: 180,
    unit: 'mg/dL',
    type: 'quantity' as const,
    referenceRange: {
      high: { value: 200, unit: 'mg/dL' },
    },
  },
};

export const mockObservationWithOnlyHighUsingObsUnit = {
  id: 'obs-7',
  display: 'Blood Sugar',
  observationValue: {
    value: 110,
    unit: 'mg/dL',
    type: 'quantity' as const,
    referenceRange: {
      high: { value: 140 },
    },
  },
};

export const mockObservationWithNoReferenceRange = {
  id: 'obs-8',
  display: 'Notes',
  observationValue: {
    value: 'Patient feeling better',
    type: 'string' as const,
  },
};

export const mockObservationWithEmptyReferenceRange = {
  id: 'obs-9',
  display: 'Comments',
  observationValue: {
    value: 100,
    unit: 'mg',
    type: 'quantity' as const,
    referenceRange: {},
  },
};

export const mockObservationWithNoUnits = {
  id: 'obs-10',
  display: 'Count',
  observationValue: {
    value: 5,
    type: 'quantity' as const,
    referenceRange: {
      low: { value: 2 },
      high: { value: 10 },
    },
  },
};
