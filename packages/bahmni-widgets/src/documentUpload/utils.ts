import type { DocumentType } from '@bahmni/services';
import type { PendingDocument } from './models';

export const isAcceptedFileType = (mimeType: string): boolean =>
  mimeType.startsWith('image/') ||
  mimeType.startsWith('video/') ||
  mimeType === 'application/pdf';

/** The configured default option when it is one of the types, otherwise the first type. */
export const getDefaultDocumentType = (
  documentTypes: DocumentType[],
  defaultOption?: string | null,
): DocumentType | null =>
  documentTypes.find(
    (type) =>
      type.label?.toLowerCase().trim() === defaultOption?.toLowerCase().trim(),
  ) ??
  documentTypes[0] ??
  null;

/** Releases the local preview of a pending document once it is saved or discarded. */
export const revokeDocumentPreview = (document: PendingDocument) => {
  if (document.url.startsWith('blob:')) {
    URL.revokeObjectURL(document.url);
  }
};
