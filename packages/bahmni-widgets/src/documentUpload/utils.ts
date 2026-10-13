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

const MEGABYTE = 1000 * 1000;

export const exceedsMaxFileSize = (
  file: File,
  maxFileSizeMb: number | undefined,
): boolean =>
  maxFileSizeMb !== undefined && file.size > maxFileSizeMb * MEGABYTE;

// Config lists extensions with or without the leading dot, in any case.
export const toDottedExtension = (extension: string): string =>
  `.${extension.trim().replace(/^\./, '').toLowerCase()}`;

export const hasSupportedExtension = (
  fileName: string,
  supportedFileTypes: string[],
): boolean => {
  const extensionStart = fileName.lastIndexOf('.');
  if (extensionStart < 0) {
    return false;
  }
  const extension = fileName.slice(extensionStart).toLowerCase();
  return supportedFileTypes.map(toDottedExtension).includes(extension);
};

export const formatFileTypes = (
  dottedExtensions: string[],
  locale: string,
): string =>
  new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(
    dottedExtensions,
  );
