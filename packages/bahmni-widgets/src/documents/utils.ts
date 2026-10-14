const DOCUMENT_FIELD_I18N_KEYS: Record<string, string> = {
  documentIdentifier: 'DOCUMENTS_DOCUMENT_IDENTIFIER',
  documentType: 'DOCUMENTS_TYPE',
  uploadedOn: 'DOCUMENTS_UPLOADED_ON',
  uploadedBy: 'DOCUMENTS_UPLOADED_BY',
  attachments: 'DOCUMENTS_ATTACHMENTS',
};

export function getFileTypeCategory(
  contentType?: string,
): 'pdf' | 'image' | 'document' {
  if (!contentType) {
    return 'document';
  }

  const lowerContentType = contentType.toLowerCase();

  if (lowerContentType.includes('pdf')) {
    return 'pdf';
  }

  if (lowerContentType.includes('image')) {
    return 'image';
  }

  return 'document';
}

export function buildDocumentUrl(documentUrl: string): string {
  if (!documentUrl || documentUrl.includes(':')) return '#';

  return `/openmrs/auth?requested_document=/document_images/${documentUrl}`;
}

export function createDocumentHeaders(
  fields: string[],
  t: (key: string) => string,
): Array<{ key: string; header: string }> {
  return fields.map((field) => ({
    key: field,
    header: t(DOCUMENT_FIELD_I18N_KEYS[field]),
  }));
}

export interface PrintableAttachment {
  url: string;
  contentType?: string;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const PRINT_STYLES =
  'body{margin:0}.attachment{page-break-after:always;break-after:page}' +
  '.attachment:last-child{page-break-after:auto;break-after:auto}' +
  'img{max-width:100%;max-height:100vh;object-fit:contain;display:block;margin:0 auto}';

export const isPdfAttachment = ({
  contentType,
}: PrintableAttachment): boolean => getFileTypeCategory(contentType) === 'pdf';

export const toPrintUrl = (url: string): string =>
  new URL(buildDocumentUrl(url), globalThis.location.origin).href;

/** Print page for the image attachments; PDFs cannot be embedded and are printed on their own. */
export function buildAttachmentsPrintHtml(
  attachments: PrintableAttachment[],
  title: string,
): string {
  const pages = attachments
    .map(({ url }) => {
      const src = escapeHtml(toPrintUrl(url));
      return `<div class="attachment"><img src="${src}" alt="${escapeHtml(
        title,
      )}" /></div>`;
    })
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${escapeHtml(
    title,
  )}</title><style>${PRINT_STYLES}</style></head><body>${pages}</body></html>`;
}
