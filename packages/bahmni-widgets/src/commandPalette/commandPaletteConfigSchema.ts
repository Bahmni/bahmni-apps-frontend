const PATIENT_FIELD_ENUM = [
  'name',
  'identifier',
  'age',
  'gender',
  'birthDate',
  'addressFieldValue',
  'extraIdentifiers',
  'customAttribute',
  'activeVisitUuid',
];

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
  then: {
    required: ['fieldType', 'fieldsToSearch'],
  },
};

const patientFieldsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['primaryFields', 'additionalFields'],
  properties: {
    primaryFields: {
      type: 'array',
      items: { type: 'string', enum: PATIENT_FIELD_ENUM },
    },
    additionalFields: {
      type: 'array',
      items: { type: 'string', enum: PATIENT_FIELD_ENUM },
    },
  },
};

// Validates home/app.json — only the fields the palette cares about.
// additionalProperties is intentionally absent at the top level because
// app.json carries other fields (extensionPoints, etc.) that we do not own.
export const homeAppConfigSchema: Record<string, unknown> = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Home App Configuration',
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
