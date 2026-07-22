export const DOCUMENT_AUTH_BASE_URL =
  '/openmrs/auth?requested_document=/document_images/';

export const resolveDocumentSrc = (src: string): string => {
  // lgtm[js/dom-text-reinterpreted-as-html] src is URL attribute only, not HTML
  return src.startsWith('blob:') ? src : DOCUMENT_AUTH_BASE_URL + src;
};
