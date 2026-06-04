import { PATIENT_FIELD_KEYS } from '@bahmni/widgets';

const triggerSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: { type: 'string', enum: ['combination', 'double'] },
    keys: { type: 'string' },
    key: { type: 'string' },
    interval: { type: 'number' },
  },
  allOf: [
    {
      if: {
        properties: { type: { const: 'combination' } },
        required: ['type'],
      },
      then: { required: ['keys'] },
    },
    {
      if: { properties: { type: { const: 'double' } }, required: ['type'] },
      then: { required: ['key'] },
    },
  ],
};

const searchAnnotationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['prefix', 'label'],
  properties: {
    prefix: { type: 'string' },
    label: { type: 'string' },
    searchType: {
      type: 'string',
      enum: ['patientAttribute', 'patientNameOrId'],
    },
    fieldType: { type: 'string', enum: ['person', 'address'] },
    fieldsToSearch: { type: 'array', items: { type: 'string' } },
  },
  if: {
    not: {
      properties: { searchType: { const: 'patientNameOrId' } },
      required: ['searchType'],
    },
  },
  then: { required: ['fieldType', 'fieldsToSearch'] },
};

const patientFieldsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['primaryFields', 'additionalFields'],
  properties: {
    primaryFields: {
      type: 'array',
      items: { type: 'string', enum: PATIENT_FIELD_KEYS },
    },
    additionalFields: {
      type: 'array',
      items: { type: 'string', enum: PATIENT_FIELD_KEYS },
    },
  },
};

export const commandPaletteAppJsonSchema: Record<string, unknown> = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Command Palette App Configuration',
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
    commandPalette: {
      type: 'object',
      additionalProperties: false,
      properties: {
        trigger: triggerSchema,
        patientFields: patientFieldsSchema,
        searchAnnotations: { type: 'array', items: searchAnnotationSchema },
      },
    },
  },
};
