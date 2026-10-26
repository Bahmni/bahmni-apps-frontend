import {
  printPdfViaIframe,
  printViaIframe,
} from '../../documentPrintButton/printViaIframe';
import {
  getFileTypeCategory,
  buildDocumentUrl,
  createDocumentHeaders,
  buildAttachmentPrintHtml,
  isPdfAttachment,
  printAttachmentsInOrder,
} from '../utils';

jest.mock('../../documentPrintButton/printViaIframe', () => ({
  printViaIframe: jest.fn(),
  printPdfViaIframe: jest.fn(),
}));

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

  describe('buildAttachmentPrintHtml', () => {
    it('renders the image from its authorised absolute url', () => {
      const html = buildAttachmentPrintHtml(
        { url: '1/a.png', contentType: 'image/png' },
        'Doc',
      );

      expect(html).toContain(
        `<img src="${globalThis.location.origin}/openmrs/auth?requested_document=/document_images/1/a.png"`,
      );
      expect(html).not.toContain('<embed');
    });

    it('escapes the title', () => {
      const html = buildAttachmentPrintHtml(
        { url: '1/a.png', contentType: 'image/png' },
        '<script>"x"</script>',
      );

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
    });
  });

  describe('isPdfAttachment', () => {
    it.each([
      ['application/pdf', true],
      ['APPLICATION/PDF', true],
      ['image/png', false],
      [undefined, false],
    ])('%s -> %s', (contentType, expected) => {
      expect(isPdfAttachment({ url: '1/a', contentType })).toBe(expected);
    });
  });

  describe('printAttachmentsInOrder', () => {
    const image = (name: string) => ({
      url: `1/${name}`,
      contentType: 'image/png',
    });
    const pdf = (name: string) => ({
      url: `1/${name}`,
      contentType: 'application/pdf',
    });

    beforeEach(() => {
      jest.clearAllMocks();
      (printViaIframe as jest.Mock).mockResolvedValue(undefined);
      (printPdfViaIframe as jest.Mock).mockResolvedValue(undefined);
    });

    it('prints each file on its own with the right printer, one after the other', async () => {
      let closeFirst: () => void = () => {};
      (printViaIframe as jest.Mock).mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            closeFirst = resolve;
          }),
      );
      const container = document.createElement('div');
      const signal = new AbortController().signal;

      const printing = printAttachmentsInOrder(
        [image('a.png'), pdf('b.pdf'), image('c.png')],
        'Doc',
        { container, signal },
      );
      await Promise.resolve();

      expect(printViaIframe).toHaveBeenCalledTimes(1);
      expect(printPdfViaIframe).not.toHaveBeenCalled();

      closeFirst();
      await printing;

      expect(printPdfViaIframe).toHaveBeenCalledWith(
        expect.stringContaining('1/b.pdf'),
        { container, focus: false, signal },
      );
      expect(printViaIframe).toHaveBeenCalledTimes(2);
      const [[firstHtml], [secondHtml]] = (printViaIframe as jest.Mock).mock
        .calls;
      expect(firstHtml).toContain('a.png');
      expect(firstHtml).not.toContain('c.png');
      expect(secondHtml).toContain('c.png');
      expect(secondHtml).toContain('<title>Doc</title>');
      expect((printViaIframe as jest.Mock).mock.calls[0][1]).toEqual({
        container,
        focus: false,
        signal,
      });
    });

    it('stops printing once the print is aborted', async () => {
      const controller = new AbortController();
      (printViaIframe as jest.Mock).mockImplementationOnce(async () =>
        controller.abort(),
      );

      await printAttachmentsInOrder([image('a.png'), image('b.png')], 'Doc', {
        signal: controller.signal,
      });

      expect(printViaIframe).toHaveBeenCalledTimes(1);
    });

    it('stops at the file that cannot be printed and rejects', async () => {
      (printViaIframe as jest.Mock).mockRejectedValueOnce(new Error('boom'));

      await expect(
        printAttachmentsInOrder([image('a.png'), image('b.png')], 'Doc', {
          signal: new AbortController().signal,
        }),
      ).rejects.toThrow('boom');

      expect(printViaIframe).toHaveBeenCalledTimes(1);
    });
  });
});
