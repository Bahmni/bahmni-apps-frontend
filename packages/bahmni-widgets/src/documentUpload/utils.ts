export const isAcceptedFileType = (mimeType: string): boolean =>
  mimeType.startsWith('image/') ||
  mimeType.startsWith('video/') ||
  mimeType === 'application/pdf';
