import {
  getFileTypeCategory,
  buildDocumentUrl,
  createDocumentHeaders,
} from '../utils';

describe('Documents Utils', () => {
  describe('getFileTypeCategory', () => {
    it('returns pdf category for PDF content type', () => {
      const category = getFileTypeCategory('application/pdf');
      expect(category).toBe('pdf');
    });

    it('returns image category for image/jpeg content type', () => {
      expect(getFileTypeCategory('image/jpeg')).toBe('image');
    });

    it('returns image category for image/png content type', () => {
      expect(getFileTypeCategory('image/png')).toBe('image');
    });

    it('returns document category for unknown content types', () => {
      const category = getFileTypeCategory('application/msword');
      expect(category).toBe('document');
    });

    it('returns document category when content type is undefined', () => {
      const category = getFileTypeCategory(undefined);
      expect(category).toBe('document');
    });

    it('handles case-insensitive content types for PDF', () => {
      expect(getFileTypeCategory('APPLICATION/PDF')).toBe('pdf');
    });

    it('handles case-insensitive content types for images', () => {
      expect(getFileTypeCategory('Image/JPEG')).toBe('image');
    });
  });

  describe('buildDocumentUrl', () => {
    const DOCUMENT_AUTH_ENDPOINT =
      '/openmrs/auth?requested_document=/document_images/';

    it.each([
      ['', '#'],
      ['https://example.com/doc.pdf', '#'],
      ['http://example.com/doc.pdf', '#'],
      [['java', 'script', ':alert(1)'].join(''), '#'],
      [['data', ':', 'text/html'].join(''), '#'],
      ['/path/doc.pdf', `${DOCUMENT_AUTH_ENDPOINT}/path/doc.pdf`],
      ['100/filename.pdf', `${DOCUMENT_AUTH_ENDPOINT}100/filename.pdf`],
      [
        '100/12-Patient Document-uuid.png',
        `${DOCUMENT_AUTH_ENDPOINT}100/12-Patient Document-uuid.png`,
      ],
    ])('buildDocumentUrl(%s) returns %s', (input, expected) => {
      expect(buildDocumentUrl(input)).toBe(expected);
    });
  });

  describe('createDocumentHeaders', () => {
    const mockT = (key: string) => key;

    it('returns header objects with key and translated header for each field', () => {
      const fields = [
        'documentIdentifier',
        'documentType',
        'uploadedOn',
        'uploadedBy',
      ];

      const result = createDocumentHeaders(fields, mockT);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        key: 'documentIdentifier',
        header: 'DOCUMENTS_DOCUMENT_IDENTIFIER',
      });
      expect(result[1]).toEqual({
        key: 'documentType',
        header: 'DOCUMENTS_TYPE',
      });
      expect(result[2]).toEqual({
        key: 'uploadedOn',
        header: 'DOCUMENTS_UPLOADED_ON',
      });
      expect(result[3]).toEqual({
        key: 'uploadedBy',
        header: 'DOCUMENTS_UPLOADED_BY',
      });
    });

    it('returns empty array when fields is empty', () => {
      const result = createDocumentHeaders([], mockT);

      expect(result).toEqual([]);
    });

    it('uses the translation function to generate the header label', () => {
      const translationFn = jest.fn((key: string) => `translated:${key}`);
      const fields = ['documentIdentifier'];

      const result = createDocumentHeaders(fields, translationFn);

      expect(translationFn).toHaveBeenCalledWith(
        'DOCUMENTS_DOCUMENT_IDENTIFIER',
      );
      expect(result[0].header).toBe('translated:DOCUMENTS_DOCUMENT_IDENTIFIER');
    });

    it('converts camelCase field names to SCREAMING_SNAKE_CASE i18n keys', () => {
      const fields = ['uploadedOn'];

      const result = createDocumentHeaders(fields, mockT);

      expect(result[0]).toEqual({
        key: 'uploadedOn',
        header: 'DOCUMENTS_UPLOADED_ON',
      });
    });
  });
});
