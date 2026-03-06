import { createMockDocumentReference } from '../__mocks__/mocks';
import {
  mapDocumentReferenceToDisplayData,
  extractDocumentReferenceAttributeNames,
} from '../utils';

describe('DocumentReference Utils', () => {
  describe('extractDocumentReferenceAttributeNames', () => {
    it('should return empty array when fields is empty', () => {
      const emptyResult = extractDocumentReferenceAttributeNames([]);
      expect(emptyResult).toEqual([]);
      const undefinedResult = extractDocumentReferenceAttributeNames(undefined);
      expect(undefinedResult).toEqual([]);
    });

    it('should filter out known fields', () => {
      const fields = [
        'documentType',
        'customAttribute1',
        'issuingDate',
        'customAttribute2',
        'masterIdentifier',
      ];
      const result = extractDocumentReferenceAttributeNames(fields);
      expect(result).toEqual(['customAttribute1', 'customAttribute2']);
    });

    it('should return all fields when none are known fields', () => {
      const fields = ['customAttr1', 'customAttr2', 'customAttr3'];
      const result = extractDocumentReferenceAttributeNames(fields);
      expect(result).toEqual(['customAttr1', 'customAttr2', 'customAttr3']);
    });

    it('should return empty array when all fields are known fields', () => {
      const fields = [
        'documentType',
        'masterIdentifier',
        'issuingDate',
        'expiryDate',
        'attachment',
      ];
      const result = extractDocumentReferenceAttributeNames(fields);
      expect(result).toEqual([]);
    });
  });

  describe('mapDocumentReferenceToDisplayData', () => {
    it('should map DocumentReference to DocumentData with all fields', () => {
      const docRef = createMockDocumentReference();
      const result = mapDocumentReferenceToDisplayData(docRef);

      expect(result.id).toBe('doc-123');
      expect(result.documentType).toBe('Passport');
      expect(result.masterIdentifier).toBe('ABC123456');
      expect(result.attributes.issuingCountry).toBe('USA');
      expect(result.issuingDate).toEqual(new Date('2020-01-15T00:00:00.000Z'));
      expect(result.expiryDate).toEqual(new Date('2030-01-15T00:00:00.000Z'));
      expect(result.attachment).toBeDefined();
    });

    it('should return null dates when context is missing', () => {
      const docRef = createMockDocumentReference({
        context: undefined,
      });
      const result = mapDocumentReferenceToDisplayData(docRef);

      expect(result.issuingDate).toBeNull();
      expect(result.expiryDate).toBeNull();
    });

    it('should handle invalid date formats', () => {
      const docRef = createMockDocumentReference({
        context: {
          period: {
            start: 'invalid-date',
            end: 'invalid-date',
          },
        },
      });
      const result = mapDocumentReferenceToDisplayData(docRef);

      expect(result.issuingDate).toBeInstanceOf(Date);
      expect(result.expiryDate).toBeInstanceOf(Date);
    });

    it('should extract issuing country from multiple extensions', () => {
      const docRef = createMockDocumentReference({
        extension: [
          {
            url: 'http://example.com/other-extension',
            valueString: 'Other',
          },
          {
            url: 'https://fhir.bahmni.org/ext/document-reference/attribute#issuing-country',
            valueString: 'MEX',
          },
        ],
      });
      const result = mapDocumentReferenceToDisplayData(docRef);

      expect(result.attributes.issuingCountry).toBe('MEX');
    });
  });
});
