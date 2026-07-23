export const DOCUMENT_AUTH_BASE_URL =
  '/openmrs/auth?requested_document=/document_images/';

export const resolveDocumentSrc = (src: string): string =>
  src.startsWith('blob:') ? src : DOCUMENT_AUTH_BASE_URL + src;
