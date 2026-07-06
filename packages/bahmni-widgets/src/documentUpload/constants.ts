// Accept all images and videos plus PDF (matches old Bahmni's supported document types).
export const FILE_INPUT_ACCEPT = 'image/*,video/*,application/pdf';

export const isAcceptedFileType = (mimeType: string): boolean =>
  mimeType.startsWith('image/') ||
  mimeType.startsWith('video/') ||
  mimeType === 'application/pdf';

// The backend DocumentReference.description column is VARCHAR(255).
export const MAX_NOTE_LENGTH = 255;
