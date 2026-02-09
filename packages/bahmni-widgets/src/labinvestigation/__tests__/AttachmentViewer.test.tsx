import { render, screen } from '@testing-library/react';

import AttachmentViewer from '../AttachmentViewer';
import { Attachment } from '../models';

describe('AttachmentViewer', () => {
  const ATTACHMENTS_BASE_URL =
    '/openmrs/auth?requested_document=/uploaded_results/';

  const mockPDFAttachment: Attachment = {
    id: 'attachment-pdf-1',
    url: 'path/to/report.pdf',
    contentType: 'application/pdf',
  };

  const mockImageAttachment: Attachment = {
    id: 'attachment-img-1',
    url: 'path/to/image.jpg',
    contentType: 'image/jpeg',
  };

  describe('PDF attachments', () => {
    it('renders an iframe for PDF attachments', () => {
      render(
        <AttachmentViewer
          attachment={mockPDFAttachment}
          index={1}
          totalCount={1}
        />,
      );

      const iframe = screen.getByTitle('attachment-pdf-1');
      expect(iframe).toBeInTheDocument();
      expect(iframe.tagName).toBe('IFRAME');
    });

    it('constructs correct URL for PDF with toolbar disabled', () => {
      render(
        <AttachmentViewer
          attachment={mockPDFAttachment}
          index={1}
          totalCount={1}
        />,
      );

      const iframe = screen.getByTitle('attachment-pdf-1') as HTMLIFrameElement;
      expect(iframe.src).toContain(
        `${ATTACHMENTS_BASE_URL}${mockPDFAttachment.url}#toolbar=0`,
      );
    });

    it('handles case-insensitive PDF content type', () => {
      const pdfUpperCase: Attachment = {
        ...mockPDFAttachment,
        contentType: 'APPLICATION/PDF',
      };

      render(
        <AttachmentViewer attachment={pdfUpperCase} index={1} totalCount={1} />,
      );

      const iframe = screen.getByTitle('attachment-pdf-1') as HTMLIFrameElement;
      expect(iframe.src).toContain('#toolbar=0');
    });
  });

  describe('Image attachments', () => {
    it('renders an img tag for image attachments', () => {
      render(
        <AttachmentViewer
          attachment={mockImageAttachment}
          index={1}
          totalCount={1}
        />,
      );

      const img = screen.getByAltText('attachment-img-1');
      expect(img).toBeInTheDocument();
      expect(img.tagName).toBe('IMG');
    });

    it('constructs correct URL for images', () => {
      render(
        <AttachmentViewer
          attachment={mockImageAttachment}
          index={1}
          totalCount={1}
        />,
      );

      const img = screen.getByAltText('attachment-img-1') as HTMLImageElement;
      expect(img.src).toContain(
        `${ATTACHMENTS_BASE_URL}${mockImageAttachment.url}`,
      );
    });

    it('handles different image content types', () => {
      const pngAttachment: Attachment = {
        id: 'attachment-png-1',
        url: 'path/to/image.png',
        contentType: 'image/png',
      };

      render(
        <AttachmentViewer
          attachment={pngAttachment}
          index={1}
          totalCount={1}
        />,
      );

      const img = screen.getByAltText('attachment-png-1');
      expect(img).toBeInTheDocument();
    });

    it('handles case-insensitive image content type', () => {
      const imageUpperCase: Attachment = {
        ...mockImageAttachment,
        contentType: 'IMAGE/JPEG',
      };

      render(
        <AttachmentViewer
          attachment={imageUpperCase}
          index={1}
          totalCount={1}
        />,
      );

      const img = screen.getByAltText('attachment-img-1');
      expect(img).toBeInTheDocument();
      expect(img.tagName).toBe('IMG');
    });
  });

  describe('Attachment numbering', () => {
    it('displays attachment number when totalCount > 1', () => {
      render(
        <AttachmentViewer
          attachment={mockPDFAttachment}
          index={2}
          totalCount={5}
        />,
      );

      expect(screen.getByText('2/5')).toBeInTheDocument();
    });

    it('does not display attachment number when totalCount is 1', () => {
      render(
        <AttachmentViewer
          attachment={mockPDFAttachment}
          index={1}
          totalCount={1}
        />,
      );

      expect(screen.queryByText('1/1')).not.toBeInTheDocument();
    });

    it('displays correct numbering for first attachment in multi-attachment set', () => {
      render(
        <AttachmentViewer
          attachment={mockPDFAttachment}
          index={1}
          totalCount={3}
        />,
      );

      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('displays correct numbering for last attachment in multi-attachment set', () => {
      render(
        <AttachmentViewer
          attachment={mockImageAttachment}
          index={10}
          totalCount={10}
        />,
      );

      expect(screen.getByText('10/10')).toBeInTheDocument();
    });
  });

  describe('Fallback behavior', () => {
    it('renders iframe when contentType is missing', () => {
      const attachmentWithoutContentType: Attachment = {
        id: 'attachment-unknown',
        url: 'path/to/unknown-file',
      };

      render(
        <AttachmentViewer
          attachment={attachmentWithoutContentType}
          index={1}
          totalCount={1}
        />,
      );

      const iframe = screen.getByTitle('attachment-unknown');
      expect(iframe).toBeInTheDocument();
      expect(iframe.tagName).toBe('IFRAME');
    });

    it('renders iframe for non-image content types', () => {
      const docAttachment: Attachment = {
        id: 'attachment-doc-1',
        url: 'path/to/document.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      render(
        <AttachmentViewer
          attachment={docAttachment}
          index={1}
          totalCount={1}
        />,
      );

      const iframe = screen.getByTitle('attachment-doc-1');
      expect(iframe).toBeInTheDocument();
      expect(iframe.tagName).toBe('IFRAME');
    });

    it('uses fallback alt text when attachment id is missing', () => {
      const attachmentWithoutId: Attachment = {
        id: '',
        url: 'path/to/image.jpg',
        contentType: 'image/jpeg',
      };

      render(
        <AttachmentViewer
          attachment={attachmentWithoutId}
          index={3}
          totalCount={5}
        />,
      );

      const img = screen.getByAltText('Attachment 3');
      expect(img).toBeInTheDocument();
    });

    it('uses fallback title for iframe when attachment id is missing', () => {
      const attachmentWithoutId: Attachment = {
        id: '',
        url: 'path/to/report.pdf',
        contentType: 'application/pdf',
      };

      render(
        <AttachmentViewer
          attachment={attachmentWithoutId}
          index={2}
          totalCount={4}
        />,
      );

      const iframe = screen.getByTitle('Attachment 2');
      expect(iframe).toBeInTheDocument();
    });
  });

  describe('URL construction', () => {
    it('prepends base URL to attachment URL for images', () => {
      render(
        <AttachmentViewer
          attachment={mockImageAttachment}
          index={1}
          totalCount={1}
        />,
      );

      const img = screen.getByAltText('attachment-img-1') as HTMLImageElement;
      expect(img.src).toContain(
        '/openmrs/auth?requested_document=/uploaded_results/',
      );
      expect(img.src).toContain(mockImageAttachment.url);
    });

    it('prepends base URL to attachment URL for PDFs', () => {
      render(
        <AttachmentViewer
          attachment={mockPDFAttachment}
          index={1}
          totalCount={1}
        />,
      );

      const iframe = screen.getByTitle('attachment-pdf-1') as HTMLIFrameElement;
      expect(iframe.src).toContain(
        '/openmrs/auth?requested_document=/uploaded_results/',
      );
      expect(iframe.src).toContain(mockPDFAttachment.url);
    });

    it('does not add toolbar parameter to non-PDF iframes', () => {
      const docAttachment: Attachment = {
        id: 'attachment-doc-1',
        url: 'path/to/document.txt',
        contentType: 'text/plain',
      };

      render(
        <AttachmentViewer
          attachment={docAttachment}
          index={1}
          totalCount={1}
        />,
      );

      const iframe = screen.getByTitle('attachment-doc-1') as HTMLIFrameElement;
      expect(iframe.src).not.toContain('#toolbar=0');
      expect(iframe.src).toContain(
        `${ATTACHMENTS_BASE_URL}${docAttachment.url}`,
      );
    });
  });
});
