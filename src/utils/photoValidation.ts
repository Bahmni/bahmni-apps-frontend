/**
 * Photo validation utilities
 * Contains validation logic for patient photo upload and capture
 */

// Validation configuration
export const PHOTO_VALIDATION_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  preferredOrientation: 'portrait' as const,
  minDimensions: {
    width: 150,
    height: 200,
  },
  maxDimensions: {
    width: 4000,
    height: 6000,
  },
};

// Photo data interface
export interface PhotoData {
  base64: string;
  filename: string;
  size: number;
  type: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a file for photo upload
 * @param file - File object to validate
 * @returns Promise<ValidationResult>
 */
export const validatePhotoFile = async (file: File): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size
  if (file.size > PHOTO_VALIDATION_CONFIG.maxFileSize) {
    errors.push('registration.patient.photo.error.fileSize');
  }

  // Check file type
  if (!PHOTO_VALIDATION_CONFIG.acceptedTypes.includes(file.type)) {
    errors.push('registration.patient.photo.error.fileType');
  }

  // Check file extension as fallback
  const extension = file.name.toLowerCase().split('.').pop();
  if (extension && !PHOTO_VALIDATION_CONFIG.acceptedExtensions.includes(`.${extension}`)) {
    errors.push('registration.patient.photo.error.fileType');
  }

  // Get image dimensions for orientation check
  try {
    const dimensions = await getImageDimensions(file);

    // Check minimum dimensions
    if (dimensions.width < PHOTO_VALIDATION_CONFIG.minDimensions.width ||
        dimensions.height < PHOTO_VALIDATION_CONFIG.minDimensions.height) {
      errors.push('registration.patient.photo.error.tooSmall');
    }

    // Check maximum dimensions
    if (dimensions.width > PHOTO_VALIDATION_CONFIG.maxDimensions.width ||
        dimensions.height > PHOTO_VALIDATION_CONFIG.maxDimensions.height) {
      errors.push('registration.patient.photo.error.tooLarge');
    }

    // Check orientation preference
    if (dimensions.width > dimensions.height) {
      warnings.push('registration.patient.photo.warning.landscape');
    }
  } catch (error) {
    errors.push('registration.patient.photo.error.processing');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Converts a file to Base64 string
 * @param file - File object to convert
 * @returns Promise<string> - Base64 encoded string
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error('Failed to convert file to Base64'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Gets image dimensions from a file
 * @param file - File object
 * @returns Promise<{width: number, height: number}>
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Converts canvas to Base64 string
 * @param canvas - Canvas element
 * @param quality - JPEG quality (0-1)
 * @returns string - Base64 encoded string
 */
export const canvasToBase64 = (canvas: HTMLCanvasElement, quality: number = 0.8): string => {
  return canvas.toDataURL('image/jpeg', quality);
};

/**
 * Generates a filename for captured photos
 * @param prefix - Filename prefix
 * @returns string - Generated filename
 */
export const generatePhotoFilename = (prefix: string = 'patient-photo'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}.jpg`;
};

/**
 * Validates photo data object
 * @param photoData - Photo data to validate
 * @returns ValidationResult
 */
export const validatePhotoData = (photoData: PhotoData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!photoData.base64 || !photoData.base64.startsWith('data:image/')) {
    errors.push('registration.patient.photo.error.invalidData');
  }

  if (!photoData.filename) {
    errors.push('registration.patient.photo.error.missingFilename');
  }

  if (!photoData.type) {
    errors.push('registration.patient.photo.error.missingType');
  }

  // Check file size
  if (photoData.size > PHOTO_VALIDATION_CONFIG.maxFileSize) {
    errors.push('registration.patient.photo.error.fileSize');
  }

  // Check dimensions if available
  if (photoData.dimensions) {
    const { width, height } = photoData.dimensions;

    if (width < PHOTO_VALIDATION_CONFIG.minDimensions.width ||
        height < PHOTO_VALIDATION_CONFIG.minDimensions.height) {
      errors.push('registration.patient.photo.error.tooSmall');
    }

    if (width > PHOTO_VALIDATION_CONFIG.maxDimensions.width ||
        height > PHOTO_VALIDATION_CONFIG.maxDimensions.height) {
      errors.push('registration.patient.photo.error.tooLarge');
    }

    // Check orientation preference
    if (width > height) {
      warnings.push('registration.patient.photo.warning.landscape');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Creates PhotoData object from file
 * @param file - File object
 * @returns Promise<PhotoData>
 */
export const createPhotoData = async (file: File): Promise<PhotoData> => {
  const base64 = await convertFileToBase64(file);
  const dimensions = await getImageDimensions(file);

  return {
    base64,
    filename: file.name,
    size: file.size,
    type: file.type,
    dimensions,
  };
};

/**
 * Estimates Base64 size from file size
 * @param fileSize - Original file size in bytes
 * @returns number - Estimated Base64 size in bytes
 */
export const estimateBase64Size = (fileSize: number): number => {
  // Base64 encoding increases size by approximately 33%
  return Math.ceil(fileSize * 1.33);
};

/**
 * Checks if browser supports getUserMedia
 * @returns boolean
 */
export const isCameraSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Gets camera constraints for photo capture
 * @returns MediaStreamConstraints
 */
export const getCameraConstraints = (): MediaStreamConstraints => {
  return {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user', // Front camera preferred
    },
    audio: false,
  };
};
