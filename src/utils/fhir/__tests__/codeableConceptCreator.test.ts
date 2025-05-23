import { createCodeableConcept, createCoding } from '../codeableConceptCreator';
import { Coding } from 'fhir/r4';

describe('codeableConceptCreator utility functions', () => {
  describe('createCoding', () => {
    it('should create a Coding with only code when other parameters are not provided', () => {
      // Arrange
      const code = 'test-code';

      // Act
      const result = createCoding(code);

      // Assert
      expect(result).toEqual({
        code: code,
      });
    });

    it('should create a Coding with code and system when provided', () => {
      // Arrange
      const code = 'test-code';
      const system = 'http://example.org/system';

      // Act
      const result = createCoding(code, system);

      // Assert
      expect(result).toEqual({
        code: code,
        system: system,
      });
    });

    it('should create a Coding with code, system, and display when all are provided', () => {
      // Arrange
      const code = 'test-code';
      const system = 'http://example.org/system';
      const display = 'Test Code Display';

      // Act
      const result = createCoding(code, system, display);

      // Assert
      expect(result).toEqual({
        code: code,
        system: system,
        display: display,
      });
    });

    it('should create a Coding with code and display when system is empty', () => {
      // Arrange
      const code = 'test-code';
      const system = '';
      const display = 'Test Code Display';

      // Act
      const result = createCoding(code, system, display);

      // Assert
      expect(result).toEqual({
        code: code,
        display: display,
      });
    });
  });

  describe('createCodeableConcept', () => {
    it('should create a CodeableConcept with only coding when display text is not provided', () => {
      // Arrange
      const coding: Coding[] = [
        { code: 'test-code', system: 'http://example.org/system' },
      ];

      // Act
      const result = createCodeableConcept(coding);

      // Assert
      expect(result).toEqual({
        coding: coding,
      });
    });

    it('should create a CodeableConcept with coding and text when both are provided', () => {
      // Arrange
      const coding: Coding[] = [
        { code: 'test-code', system: 'http://example.org/system' },
      ];
      const displayText = 'Test Display Text';

      // Act
      const result = createCodeableConcept(coding, displayText);

      // Assert
      expect(result).toEqual({
        coding: coding,
        text: displayText,
      });
    });

    it('should create a CodeableConcept with undefined coding when not provided', () => {
      // Arrange
      const displayText = 'Test Display Text';

      // Act
      const result = createCodeableConcept(undefined, displayText);

      // Assert
      expect(result).toEqual({
        coding: undefined,
        text: displayText,
      });
    });

    it('should not include text property when displayText is empty', () => {
      // Arrange
      const coding: Coding[] = [
        { code: 'test-code', system: 'http://example.org/system' },
      ];
      const displayText = '';

      // Act
      const result = createCodeableConcept(coding, displayText);

      // Assert
      expect(result).toEqual({
        coding: coding,
      });
      expect(result.text).toBeUndefined();
    });
  });
});
