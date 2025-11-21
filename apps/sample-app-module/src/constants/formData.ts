export const clinicalFormMetadata = {
  id: 2,
  uuid: 'clinical-assessment-form-v1',
  name: 'Clinical Assessment Form',
  version: '1.0',
  controls: [
    // Row 0: Temperature and Heart Rate
    {
      type: 'obsControl',
      label: {
        type: 'label',
        value: 'Body Temperature (°C)',
      },
      properties: {
        mandatory: true,
        location: { row: 0, column: 0 },
      },
      id: 'temperature',
      concept: {
        uuid: 'c36af094-3f10-11e4-adec-0800271c1b75',
        name: 'Temperature',
        datatype: 'Numeric',
        conceptClass: 'Misc',
        lowNormal: 36.0,
        hiNormal: 37.5,
        lowAbsolute: 35.0,
        hiAbsolute: 43.0,
      },
    },
    {
      type: 'obsControl',
      label: {
        type: 'label',
        value: 'Heart Rate (bpm)',
      },
      properties: {
        mandatory: true,
        location: { row: 0, column: 1 },
      },
      id: 'heart-rate',
      concept: {
        uuid: 'c36bc1a4-3f10-11e4-adec-0800271c1b75',
        name: 'Pulse',
        datatype: 'Numeric',
        conceptClass: 'Misc',
        lowNormal: 60,
        hiNormal: 100,
        lowAbsolute: 40,
        hiAbsolute: 200,
      },
    },

    // Row 1: Respiratory Rate and SpO2
    {
      type: 'obsControl',
      label: {
        type: 'label',
        value: 'Respiratory Rate (/min)',
      },
      properties: {
        mandatory: false,
        location: { row: 1, column: 0 },
      },
      id: 'respiratory-rate',
      concept: {
        uuid: 'c36c7b28-3f10-11e4-adec-0800271c1b75',
        name: 'Respiratory Rate',
        datatype: 'Numeric',
        conceptClass: 'Misc',
        lowNormal: 12,
        hiNormal: 20,
        lowAbsolute: 8,
        hiAbsolute: 40,
      },
    },
    {
      type: 'obsControl',
      label: {
        type: 'label',
        value: 'SpO2 (%)',
      },
      properties: {
        mandatory: false,
        location: { row: 1, column: 1 },
      },
      id: 'spo2',
      concept: {
        uuid: 'c36c7ce4-3f10-11e4-adec-0800271c1b75',
        name: 'Oxygen Saturation',
        datatype: 'Numeric',
        conceptClass: 'Misc',
        lowNormal: 95,
        hiNormal: 100,
        lowAbsolute: 70,
        hiAbsolute: 100,
      },
    },

    // Row 2: Blood Pressure Obs Group
    {
      type: 'obsGroupControl',
      label: {
        type: 'label',
        value: 'Blood Pressure Measurement',
      },
      properties: {
        location: { row: 2, column: 0 },
        abnormal: false,
      },
      id: 'blood-pressure-group',
      concept: {
        uuid: 'c36e9f62-3f10-11e4-adec-0800271c1b75',
        name: 'Blood Pressure',
        datatype: 'N/A',
        conceptClass: 'Concept Details',
        description: {
          value: 'Systolic and Diastolic blood pressure readings',
        },
      },
      controls: [
        {
          type: 'obsControl',
          label: {
            type: 'label',
            value: 'Systolic BP (mmHg)',
          },
          properties: {
            mandatory: true,
            location: { row: 0, column: 0 },
          },
          id: 'systolic',
          concept: {
            uuid: 'c36e9ed8-3f10-11e4-adec-0800271c1b75',
            name: 'Systolic Blood Pressure',
            datatype: 'Numeric',
            conceptClass: 'Misc',
            lowNormal: 90,
            hiNormal: 120,
            lowAbsolute: 60,
            hiAbsolute: 250,
          },
        },
        {
          type: 'obsControl',
          label: {
            type: 'label',
            value: 'Diastolic BP (mmHg)',
          },
          properties: {
            mandatory: true,
            location: { row: 0, column: 1 },
          },
          id: 'diastolic',
          concept: {
            uuid: 'c36e9f4e-3f10-11e4-adec-0800271c1b75',
            name: 'Diastolic Blood Pressure',
            datatype: 'Numeric',
            conceptClass: 'Misc',
            lowNormal: 60,
            hiNormal: 80,
            lowAbsolute: 40,
            hiAbsolute: 150,
          },
        },
      ],
    },

    // Row 3: Weight and Height
    {
      type: 'obsControl',
      label: {
        type: 'label',
        value: 'Weight (kg)',
      },
      properties: {
        mandatory: false,
        location: { row: 3, column: 0 },
      },
      id: 'weight',
      concept: {
        uuid: 'c36c7d5a-3f10-11e4-adec-0800271c1b75',
        name: 'Weight',
        datatype: 'Numeric',
        conceptClass: 'Misc',
        lowAbsolute: 0.5,
        hiAbsolute: 500,
      },
    },
    {
      type: 'obsControl',
      label: {
        type: 'label',
        value: 'Height (cm)',
      },
      properties: {
        mandatory: false,
        location: { row: 3, column: 1 },
      },
      id: 'height',
      concept: {
        uuid: 'c36c7dd6-3f10-11e4-adec-0800271c1b75',
        name: 'Height',
        datatype: 'Numeric',
        conceptClass: 'Misc',
        lowAbsolute: 20,
        hiAbsolute: 300,
      },
    },

    // Row 4: Chief Complaint
    {
      type: 'obsControl',
      label: {
        type: 'label',
        value: 'Chief Complaint',
      },
      properties: {
        mandatory: false,
        location: { row: 4, column: 0 },
      },
      id: 'chief-complaint',
      concept: {
        uuid: 'c36c8094-3f10-11e4-adec-0800271c1b75',
        name: 'Chief Complaint',
        datatype: 'Text',
        conceptClass: 'Misc',
      },
    },

    // Row 5: Clinical Notes
    {
      type: 'obsControl',
      label: {
        type: 'label',
        value: 'Additional Clinical Notes',
      },
      properties: {
        mandatory: false,
        location: { row: 5, column: 0 },
      },
      id: 'clinical-notes',
      concept: {
        uuid: 'c36c818c-3f10-11e4-adec-0800271c1b75',
        name: 'Clinical Notes',
        datatype: 'Text',
        conceptClass: 'Misc',
      },
    },
  ],
  // Note: No events.onFormInit to avoid script execution issues
};

/**
 * Sample existing observations
 */
export const existingObservations = [
  {
    uuid: 'obs-001',
    concept: {
      uuid: 'c36af094-3f10-11e4-adec-0800271c1b75',
      name: 'Temperature',
    },
    value: 36.8,
    formFieldPath: 'clinical-assessment-form-v1.2/temperature-0',
    encounterUuid: 'encounter-001',
    obsDateTime: '2024-10-24T09:15:00.000Z',
    voided: false,
  },
  {
    uuid: 'obs-002',
    concept: {
      uuid: 'c36bc1a4-3f10-11e4-adec-0800271c1b75',
      name: 'Pulse',
    },
    value: 72,
    formFieldPath: 'clinical-assessment-form-v1.2/heart-rate-0',
    encounterUuid: 'encounter-001',
    obsDateTime: '2024-10-24T09:15:00.000Z',
    voided: false,
  },
  {
    uuid: 'obs-003',
    concept: {
      uuid: 'c36c7b28-3f10-11e4-adec-0800271c1b75',
      name: 'Respiratory Rate',
    },
    value: 16,
    formFieldPath: 'clinical-assessment-form-v1.2/respiratory-rate-0',
    encounterUuid: 'encounter-001',
    obsDateTime: '2024-10-24T09:15:00.000Z',
    voided: false,
  },
  {
    uuid: 'obs-004',
    concept: {
      uuid: 'c36c7ce4-3f10-11e4-adec-0800271c1b75',
      name: 'Oxygen Saturation',
    },
    value: 98,
    formFieldPath: 'clinical-assessment-form-v1.2/spo2-0',
    encounterUuid: 'encounter-001',
    obsDateTime: '2024-10-24T09:15:00.000Z',
    voided: false,
  },
  {
    uuid: 'obs-005',
    concept: {
      uuid: 'c36e9ed8-3f10-11e4-adec-0800271c1b75',
      name: 'Systolic Blood Pressure',
    },
    value: 120,
    formFieldPath:
      'clinical-assessment-form-v1.2/blood-pressure-group-0/systolic-0',
    encounterUuid: 'encounter-001',
    obsDateTime: '2024-10-24T09:15:00.000Z',
    voided: false,
  },
  {
    uuid: 'obs-006',
    concept: {
      uuid: 'c36e9f4e-3f10-11e4-adec-0800271c1b75',
      name: 'Diastolic Blood Pressure',
    },
    value: 80,
    formFieldPath:
      'clinical-assessment-form-v1.2/blood-pressure-group-0/diastolic-0',
    encounterUuid: 'encounter-001',
    obsDateTime: '2024-10-24T09:15:00.000Z',
    voided: false,
  },
  {
    uuid: 'obs-007',
    concept: {
      uuid: 'c36c7d5a-3f10-11e4-adec-0800271c1b75',
      name: 'Weight',
    },
    value: 70,
    formFieldPath: 'clinical-assessment-form-v1.2/weight-0',
    encounterUuid: 'encounter-001',
    obsDateTime: '2024-10-24T09:15:00.000Z',
    voided: false,
  },
  {
    uuid: 'obs-008',
    concept: {
      uuid: 'c36c7dd6-3f10-11e4-adec-0800271c1b75',
      name: 'Height',
    },
    value: 175,
    formFieldPath: 'clinical-assessment-form-v1.2/height-0',
    encounterUuid: 'encounter-001',
    obsDateTime: '2024-10-24T09:15:00.000Z',
    voided: false,
  },
];

/**
 * Patient information
 */
export const patientData = {
  uuid: 'patient-abc-123',
  name: 'Jane Smith',
  age: 35,
  gender: 'F',
  identifier: 'MRN-2024-5678',
  birthdate: '1989-06-20',
  address: '123 Main Street, Springfield',
};

/**
 * Internationalization translations
 */
export const translationData = {
  labels: {},
  concepts: {},
};
