export const mockVitalSignsSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Vital Signs Configuration Schema',
  description:
    'Schema for configuring vital signs capture and display in the EMR system',
  type: 'object',
  required: ['vitalSigns', 'captureFrequency', 'alertThresholds'],
  additionalProperties: false,
  properties: {
    vitalSigns: {
      type: 'array',
      description: 'List of vital signs to be captured',
      minItems: 1,
      items: {
        type: 'object',
        required: ['name', 'conceptUuid', 'unit', 'dataType'],
        additionalProperties: false,
        properties: {
          name: {
            type: 'string',
            description: 'Display name of the vital sign',
            minLength: 1,
          },
          conceptUuid: {
            type: 'string',
            description: 'OpenMRS concept UUID for the vital sign',
            pattern:
              '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
          },
          unit: {
            type: 'string',
            description: 'Unit of measurement',
            minLength: 1,
          },
          dataType: {
            type: 'string',
            description: 'Type of data captured',
            enum: ['numeric', 'text', 'boolean', 'coded'],
          },
          normalRange: {
            type: 'object',
            description: 'Normal range for the vital sign',
            additionalProperties: false,
            properties: {
              min: {
                type: 'number',
                description: 'Minimum normal value',
              },
              max: {
                type: 'number',
                description: 'Maximum normal value',
              },
            },
          },
          mandatory: {
            type: 'boolean',
            description: 'Whether this vital sign is mandatory during capture',
          },
        },
      },
    },
    captureFrequency: {
      type: 'object',
      description: 'Frequency settings for vital signs capture',
      required: ['defaultInterval', 'unit'],
      additionalProperties: false,
      properties: {
        defaultInterval: {
          type: 'integer',
          description: 'Default interval for capturing vital signs',
          minimum: 1,
        },
        unit: {
          type: 'string',
          description: 'Time unit for the interval',
          enum: ['minutes', 'hours', 'days'],
        },
        allowCustom: {
          type: 'boolean',
          description: 'Allow custom frequency settings',
        },
      },
    },
    alertThresholds: {
      type: 'object',
      description: 'Threshold configuration for vital signs alerts',
      required: ['enabled'],
      additionalProperties: false,
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Enable alert system for abnormal vital signs',
        },
        notificationMethod: {
          type: 'array',
          description: 'Methods to use for notifications',
          items: {
            type: 'string',
            enum: ['ui', 'email', 'sms'],
          },
        },
      },
    },
  },
};

export const mockValidVitalSignsConfig = {
  vitalSigns: [
    {
      name: 'Blood Pressure',
      conceptUuid: '5085f420-b8c8-4a3d-9c8f-1a7e3b4c5d6e',
      unit: 'mmHg',
      dataType: 'numeric',
      normalRange: {
        min: 90,
        max: 140,
      },
      mandatory: true,
    },
    {
      name: 'Heart Rate',
      conceptUuid: '6f2a8d3c-1b4e-5c7a-9d8e-2f3a4b5c6d7e',
      unit: 'bpm',
      dataType: 'numeric',
      normalRange: {
        min: 60,
        max: 100,
      },
      mandatory: true,
    },
    {
      name: 'Temperature',
      conceptUuid: '7e3b4c5d-2c5f-6d8b-a9f0-3e4f5a6b7c8d',
      unit: '°C',
      dataType: 'numeric',
      normalRange: {
        min: 36.5,
        max: 37.5,
      },
      mandatory: false,
    },
  ],
  captureFrequency: {
    defaultInterval: 4,
    unit: 'hours',
    allowCustom: true,
  },
  alertThresholds: {
    enabled: true,
    notificationMethod: ['ui', 'email'],
  },
};

export const mockInvalidVitalSignsConfig = {
  vitalSigns: [
    {
      name: 'Blood Pressure',
      conceptUuid: 'invalid-uuid-format',
      unit: 'mmHg',
      dataType: 'invalid-type',
      normalRange: {
        min: 90,
        max: 140,
      },
      extraField: 'not allowed',
    },
  ],
  captureFrequency: {
    defaultInterval: -5,
    unit: 'weeks',
  },
  alertThresholds: {
    enabled: 'yes',
    notificationMethod: ['invalid-method'],
  },
  unexpectedProperty: 'should fail validation',
};
