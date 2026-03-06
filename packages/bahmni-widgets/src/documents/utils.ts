const DOCUMENT_FIELD_I18N_KEYS: Record<string, string> = {
  documentIdentifier: 'DOCUMENTS_DOCUMENT_IDENTIFIER',
  documentType: 'DOCUMENTS_TYPE',
  uploadedOn: 'DOCUMENTS_UPLOADED_ON',
  uploadedBy: 'DOCUMENTS_UPLOADED_BY',
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
