/**
 * Person Attribute Format Types
 * Maps OpenMRS data types to input control types
 */
export enum AttributeFormat {
  // Boolean types - Render as Checkbox
  BOOLEAN = 'java.lang.Boolean',
  BOOLEAN_DATATYPE = 'org.openmrs.customdatatype.datatype.BooleanDatatype',

  // Concept types - Render as Dropdown/Select
  CONCEPT = 'org.openmrs.Concept',
  CODED_CONCEPT = 'org.bahmni.module.bahmnicore.customdatatype.datatype.CodedConceptDatatype',
  CONCEPT_DATATYPE = 'org.openmrs.customdatatype.datatype.ConceptDatatype',

  // String types - Render as Text Input
  STRING = 'java.lang.String',
  FREE_TEXT = 'org.openmrs.customdatatype.datatype.FreeTextDatatype',
  REGEX_VALIDATED_TEXT = 'org.openmrs.customdatatype.datatype.RegexValidatedTextDatatype',

  // Number types - Render as Number Input
  INTEGER = 'java.lang.Integer',
  FLOAT = 'java.lang.Float',

  // Date types - Render as Date Picker
  ATTRIBUTABLE_DATE = 'org.openmrs.util.AttributableDate',
  DATE_DATATYPE = 'org.openmrs.customdatatype.datatype.DateDatatype',
}

/**
 * Input types for person attribute rendering
 */
export enum AttributeInputType {
  CHECKBOX = 'checkbox',
  DROPDOWN = 'dropdown',
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
}

/**
 * Maps OpenMRS format string to AttributeInputType
 * @param format - The format string from PersonAttributeType
 * @returns The corresponding AttributeInputType
 */
export const getInputTypeForFormat = (format: string): AttributeInputType => {
  // Boolean types
  if (
    format === AttributeFormat.BOOLEAN ||
    format === AttributeFormat.BOOLEAN_DATATYPE
  ) {
    return AttributeInputType.CHECKBOX;
  }

  // Concept types (dropdown)
  if (
    format === AttributeFormat.CONCEPT ||
    format === AttributeFormat.CODED_CONCEPT ||
    format === AttributeFormat.CONCEPT_DATATYPE
  ) {
    return AttributeInputType.DROPDOWN;
  }

  // Number types
  if (format === AttributeFormat.INTEGER || format === AttributeFormat.FLOAT) {
    return AttributeInputType.NUMBER;
  }

  // Date types
  if (
    format === AttributeFormat.ATTRIBUTABLE_DATE ||
    format === AttributeFormat.DATE_DATATYPE
  ) {
    return AttributeInputType.DATE;
  }

  // Default to text input for strings and unknown types
  return AttributeInputType.TEXT;
};

/**
 * Checks if a format represents a boolean type
 */
export const isBooleanFormat = (format: string): boolean => {
  return (
    format === AttributeFormat.BOOLEAN ||
    format === AttributeFormat.BOOLEAN_DATATYPE
  );
};

/**
 * Checks if a format represents a concept type (dropdown)
 */
export const isConceptFormat = (format: string): boolean => {
  return (
    format === AttributeFormat.CONCEPT ||
    format === AttributeFormat.CODED_CONCEPT ||
    format === AttributeFormat.CONCEPT_DATATYPE
  );
};

/**
 * Checks if a format represents a number type
 */
export const isNumberFormat = (format: string): boolean => {
  return format === AttributeFormat.INTEGER || format === AttributeFormat.FLOAT;
};

/**
 * Checks if a format represents a date type
 */
export const isDateFormat = (format: string): boolean => {
  return (
    format === AttributeFormat.ATTRIBUTABLE_DATE ||
    format === AttributeFormat.DATE_DATATYPE
  );
};

/**
 * Checks if a format represents a text type
 */
export const isTextFormat = (format: string): boolean => {
  return (
    format === AttributeFormat.STRING ||
    format === AttributeFormat.FREE_TEXT ||
    format === AttributeFormat.REGEX_VALIDATED_TEXT
  );
};
