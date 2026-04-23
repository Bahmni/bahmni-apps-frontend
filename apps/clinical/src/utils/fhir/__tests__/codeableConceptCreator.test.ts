import { Coding } from 'fhir/r4';
import { createCodeableConcept, createCoding } from '../codeableConceptCreator';

describe('codeableConceptCreator utility functions', () => {
  describe('createCoding', () => {
    it('should create a Coding with only code when other parameters are not provided', () => {
      const code = 'test-code';

      const result = createCoding(code);

      expect(result).toEqual({
        code: code,
      });
    });

    it('should create a Coding with code and system when provided', () => {
      const code = 'test-code';
      const system = 'http://example.org/system';

      const result = createCoding(code, system);

      expect(result).toEqual({
        code: code,
        system: system,
      });
    });

    it('should create a Coding with code, system, and display when all are provided', () => {
      const code = 'test-code';
      const system = 'http://example.org/system';
      const display = 'Test Code Display';

      const result = createCoding(code, system, display);

      expect(result).toEqual({
        code: code,
        system: system,
        display: display,
      });
    });

    it('should create a Coding with code and display when system is empty', () => {
      const code = 'test-code';
      const system = '';
      const display = 'Test Code Display';

      const result = createCoding(code, system, display);

      expect(result).toEqual({
        code: code,
        display: display,
      });
    });
  });

  describe('createCodeableConcept', () => {
    it('should create a CodeableConcept with only coding when display text is not provided', () => {
      const coding: Coding[] = [
        { code: 'test-code', system: 'http://example.org/system' },
      ];

      const result = createCodeableConcept(coding);

      expect(result).toEqual({
        coding: coding,
      });
    });

    it('should create a CodeableConcept with coding and text when both are provided', () => {
      const coding: Coding[] = [
        { code: 'test-code', system: 'http://example.org/system' },
      ];
      const displayText = 'Test Display Text';

      const result = createCodeableConcept(coding, displayText);

      expect(result).toEqual({
        coding: coding,
        text: displayText,
      });
    });

    it('should create a CodeableConcept with undefined coding when not provided', () => {
      const displayText = 'Test Display Text';

      const result = createCodeableConcept(undefined, displayText);

      expect(result).toEqual({
        coding: undefined,
        text: displayText,
      });
    });

    it('should not include text property when displayText is empty', () => {
      const coding: Coding[] = [
        { code: 'test-code', system: 'http://example.org/system' },
      ];
      const displayText = '';

      const result = createCodeableConcept(coding, displayText);

      expect(result).toEqual({
        coding: coding,
      });
      expect(result.text).toBeUndefined();
    });
  });
});
