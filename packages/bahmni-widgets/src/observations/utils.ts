/**
 * Check if a value is an image filename
 */
export const isImageValue = (value: string): boolean => {
  if (!value) return false;
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
  const lowerValue = value.toLowerCase();
  return imageExtensions.some((ext) => lowerValue.endsWith(ext));
};

/**
 * Check if a value is a video filename
 */
export const isVideoValue = (value: string): boolean => {
  if (!value) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const lowerValue = value.toLowerCase();
  return videoExtensions.some((ext) => lowerValue.endsWith(ext));
};

/**
 * Get media URL for authenticated document access
 */
export const getMediaUrl = (filename: string): string => {
  return `/openmrs/auth?requested_document=/document_images/${filename}`;
};
