import {
  AttributeFormat,
  AttributeInputType,
  getInputTypeForFormat,
  isBooleanFormat,
  isConceptFormat,
  isNumberFormat,
  isDateFormat,
  isTextFormat,
} from '../attributeFormatMapper';

describe('attributeFormatMapper', () => {
  describe('getInputTypeForFormat', () => {
    describe('Boolean Types', () => {
      it('should return CHECKBOX for java.lang.Boolean', () => {
        expect(getInputTypeForFormat(AttributeFormat.BOOLEAN)).toBe(
          AttributeInputType.CHECKBOX,
        );
      });

      it('should return CHECKBOX for BooleanDatatype', () => {
        expect(getInputTypeForFormat(AttributeFormat.BOOLEAN_DATATYPE)).toBe(
          AttributeInputType.CHECKBOX,
        );
      });
    });

    describe('Concept Types', () => {
      it('should return DROPDOWN for org.openmrs.Concept', () => {
        expect(getInputTypeForFormat(AttributeFormat.CONCEPT)).toBe(
          AttributeInputType.DROPDOWN,
        );
      });

      it('should return DROPDOWN for CodedConceptDatatype', () => {
        expect(getInputTypeForFormat(AttributeFormat.CODED_CONCEPT)).toBe(
          AttributeInputType.DROPDOWN,
        );
      });

      it('should return DROPDOWN for ConceptDatatype', () => {
        expect(getInputTypeForFormat(AttributeFormat.CONCEPT_DATATYPE)).toBe(
          AttributeInputType.DROPDOWN,
        );
      });
    });

    describe('Number Types', () => {
      it('should return NUMBER for java.lang.Integer', () => {
        expect(getInputTypeForFormat(AttributeFormat.INTEGER)).toBe(
          AttributeInputType.NUMBER,
        );
      });

      it('should return NUMBER for java.lang.Float', () => {
        expect(getInputTypeForFormat(AttributeFormat.FLOAT)).toBe(
          AttributeInputType.NUMBER,
        );
      });
    });

    describe('Date Types', () => {
      it('should return DATE for AttributableDate', () => {
        expect(getInputTypeForFormat(AttributeFormat.ATTRIBUTABLE_DATE)).toBe(
          AttributeInputType.DATE,
        );
      });

      it('should return DATE for DateDatatype', () => {
        expect(getInputTypeForFormat(AttributeFormat.DATE_DATATYPE)).toBe(
          AttributeInputType.DATE,
        );
      });
    });

    describe('String Types', () => {
      it('should return TEXT for java.lang.String', () => {
        expect(getInputTypeForFormat(AttributeFormat.STRING)).toBe(
          AttributeInputType.TEXT,
        );
      });

      it('should return TEXT for FreeTextDatatype', () => {
        expect(getInputTypeForFormat(AttributeFormat.FREE_TEXT)).toBe(
          AttributeInputType.TEXT,
        );
      });

      it('should return TEXT for RegexValidatedTextDatatype', () => {
        expect(
          getInputTypeForFormat(AttributeFormat.REGEX_VALIDATED_TEXT),
        ).toBe(AttributeInputType.TEXT);
      });
    });

    describe('Unknown Types', () => {
      it('should return TEXT for unknown format', () => {
        expect(getInputTypeForFormat('unknown.format')).toBe(
          AttributeInputType.TEXT,
        );
      });

      it('should return TEXT for empty string', () => {
        expect(getInputTypeForFormat('')).toBe(AttributeInputType.TEXT);
      });

      it('should return TEXT for random string', () => {
        expect(getInputTypeForFormat('some.random.format')).toBe(
          AttributeInputType.TEXT,
        );
      });
    });
  });

  describe('isBooleanFormat', () => {
    it('should return true for java.lang.Boolean', () => {
      expect(isBooleanFormat(AttributeFormat.BOOLEAN)).toBe(true);
    });

    it('should return true for BooleanDatatype', () => {
      expect(isBooleanFormat(AttributeFormat.BOOLEAN_DATATYPE)).toBe(true);
    });

    it('should return false for non-boolean formats', () => {
      expect(isBooleanFormat(AttributeFormat.STRING)).toBe(false);
      expect(isBooleanFormat(AttributeFormat.INTEGER)).toBe(false);
      expect(isBooleanFormat(AttributeFormat.CONCEPT)).toBe(false);
      expect(isBooleanFormat('unknown')).toBe(false);
    });
  });

  describe('isConceptFormat', () => {
    it('should return true for org.openmrs.Concept', () => {
      expect(isConceptFormat(AttributeFormat.CONCEPT)).toBe(true);
    });

    it('should return true for CodedConceptDatatype', () => {
      expect(isConceptFormat(AttributeFormat.CODED_CONCEPT)).toBe(true);
    });

    it('should return true for ConceptDatatype', () => {
      expect(isConceptFormat(AttributeFormat.CONCEPT_DATATYPE)).toBe(true);
    });

    it('should return false for non-concept formats', () => {
      expect(isConceptFormat(AttributeFormat.STRING)).toBe(false);
      expect(isConceptFormat(AttributeFormat.BOOLEAN)).toBe(false);
      expect(isConceptFormat(AttributeFormat.INTEGER)).toBe(false);
      expect(isConceptFormat('unknown')).toBe(false);
    });
  });

  describe('isNumberFormat', () => {
    it('should return true for java.lang.Integer', () => {
      expect(isNumberFormat(AttributeFormat.INTEGER)).toBe(true);
    });

    it('should return true for java.lang.Float', () => {
      expect(isNumberFormat(AttributeFormat.FLOAT)).toBe(true);
    });

    it('should return false for non-number formats', () => {
      expect(isNumberFormat(AttributeFormat.STRING)).toBe(false);
      expect(isNumberFormat(AttributeFormat.BOOLEAN)).toBe(false);
      expect(isNumberFormat(AttributeFormat.CONCEPT)).toBe(false);
      expect(isNumberFormat('unknown')).toBe(false);
    });
  });

  describe('isDateFormat', () => {
    it('should return true for AttributableDate', () => {
      expect(isDateFormat(AttributeFormat.ATTRIBUTABLE_DATE)).toBe(true);
    });

    it('should return true for DateDatatype', () => {
      expect(isDateFormat(AttributeFormat.DATE_DATATYPE)).toBe(true);
    });

    it('should return false for non-date formats', () => {
      expect(isDateFormat(AttributeFormat.STRING)).toBe(false);
      expect(isDateFormat(AttributeFormat.BOOLEAN)).toBe(false);
      expect(isDateFormat(AttributeFormat.INTEGER)).toBe(false);
      expect(isDateFormat('unknown')).toBe(false);
    });
  });

  describe('isTextFormat', () => {
    it('should return true for java.lang.String', () => {
      expect(isTextFormat(AttributeFormat.STRING)).toBe(true);
    });

    it('should return true for FreeTextDatatype', () => {
      expect(isTextFormat(AttributeFormat.FREE_TEXT)).toBe(true);
    });

    it('should return true for RegexValidatedTextDatatype', () => {
      expect(isTextFormat(AttributeFormat.REGEX_VALIDATED_TEXT)).toBe(true);
    });

    it('should return false for non-text formats', () => {
      expect(isTextFormat(AttributeFormat.BOOLEAN)).toBe(false);
      expect(isTextFormat(AttributeFormat.INTEGER)).toBe(false);
      expect(isTextFormat(AttributeFormat.CONCEPT)).toBe(false);
      expect(isTextFormat('unknown')).toBe(false);
    });
  });

  describe('Format Enum Values', () => {
    it('should have correct boolean format values', () => {
      expect(AttributeFormat.BOOLEAN).toBe('java.lang.Boolean');
      expect(AttributeFormat.BOOLEAN_DATATYPE).toBe(
        'org.openmrs.customdatatype.datatype.BooleanDatatype',
      );
    });

    it('should have correct concept format values', () => {
      expect(AttributeFormat.CONCEPT).toBe('org.openmrs.Concept');
      expect(AttributeFormat.CODED_CONCEPT).toBe(
        'org.bahmni.module.bahmnicore.customdatatype.datatype.CodedConceptDatatype',
      );
      expect(AttributeFormat.CONCEPT_DATATYPE).toBe(
        'org.openmrs.customdatatype.datatype.ConceptDatatype',
      );
    });

    it('should have correct string format values', () => {
      expect(AttributeFormat.STRING).toBe('java.lang.String');
      expect(AttributeFormat.FREE_TEXT).toBe(
        'org.openmrs.customdatatype.datatype.FreeTextDatatype',
      );
      expect(AttributeFormat.REGEX_VALIDATED_TEXT).toBe(
        'org.openmrs.customdatatype.datatype.RegexValidatedTextDatatype',
      );
    });

    it('should have correct number format values', () => {
      expect(AttributeFormat.INTEGER).toBe('java.lang.Integer');
      expect(AttributeFormat.FLOAT).toBe('java.lang.Float');
    });

    it('should have correct date format values', () => {
      expect(AttributeFormat.ATTRIBUTABLE_DATE).toBe(
        'org.openmrs.util.AttributableDate',
      );
      expect(AttributeFormat.DATE_DATATYPE).toBe(
        'org.openmrs.customdatatype.datatype.DateDatatype',
      );
    });
  });

  describe('Input Type Enum Values', () => {
    it('should have correct input type values', () => {
      expect(AttributeInputType.CHECKBOX).toBe('checkbox');
      expect(AttributeInputType.DROPDOWN).toBe('dropdown');
      expect(AttributeInputType.TEXT).toBe('text');
      expect(AttributeInputType.NUMBER).toBe('number');
      expect(AttributeInputType.DATE).toBe('date');
    });
  });
});
