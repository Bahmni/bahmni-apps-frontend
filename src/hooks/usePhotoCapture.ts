/**
 * usePhotoCapture hook
 * Custom hook for managing photo capture and upload functionality
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PhotoData,
  ValidationResult,
  validatePhotoFile,
  createPhotoData,
  canvasToBase64,
  generatePhotoFilename,
  validatePhotoData,
  isCameraSupported,
  getCameraConstraints,
} from '../utils/photoValidation';

interface UsePhotoCaptureOptions {
  onPhotoChange?: (photo: PhotoData | null) => void;
  onValidationError?: (errors: string[]) => void;
  onValidationWarning?: (warnings: string[]) => void;
}

interface UsePhotoCaptureReturn {
  // State
  photoData: PhotoData | null;
  isProcessing: boolean;
  validationError: string | null;
  validationWarning: string | null;

  // Webcam state
  isWebcamModalOpen: boolean;
  isWebcamAvailable: boolean;
  webcamStream: MediaStream | null;

  // Actions
  handleFileUpload: (files: FileList | File[]) => Promise<void>;
  handleWebcamCapture: (imageData: string) => Promise<void>;
  handleRemovePhoto: () => void;
  openWebcamModal: () => void;
  closeWebcamModal: () => void;

  // Utilities
  clearValidationMessages: () => void;
  triggerFileInput: () => void;
  startWebcamStream: () => Promise<MediaStream | null>;
  stopWebcamStream: () => void;
}

export const usePhotoCapture = (options: UsePhotoCaptureOptions = {}): UsePhotoCaptureReturn => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isWebcamModalOpen, setIsWebcamModalOpen] = useState(false);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  // Check webcam availability on mount
  useEffect(() => {
    setIsWebcamAvailable(isCameraSupported());
  }, []);

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  // Handle validation results
  const handleValidationResult = useCallback((result: ValidationResult) => {
    if (result.errors.length > 0) {
      const errorMessage = result.errors.map(key => t(key)).join(', ');
      setValidationError(errorMessage);
      options.onValidationError?.(result.errors);
    } else {
      setValidationError(null);
    }

    if (result.warnings.length > 0) {
      const warningMessage = result.warnings.map(key => t(key)).join(', ');
      setValidationWarning(warningMessage);
      options.onValidationWarning?.(result.warnings);
    } else {
      setValidationWarning(null);
    }
  }, [t, options]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessing(true);
    setValidationError(null);
    setValidationWarning(null);

    try {
      // Validate file
      const validationResult = await validatePhotoFile(file);
      handleValidationResult(validationResult);

      if (validationResult.isValid) {
        // Create photo data
        const newPhotoData = await createPhotoData(file);

        // Validate photo data
        const dataValidationResult = validatePhotoData(newPhotoData);
        handleValidationResult(dataValidationResult);

        if (dataValidationResult.isValid) {
          setPhotoData(newPhotoData);
          options.onPhotoChange?.(newPhotoData);
        }
      }
    } catch (error) {
      console.error('Error processing photo:', error);
      setValidationError(t('registration.patient.photo.error.processing'));
      options.onValidationError?.(['registration.patient.photo.error.processing']);
    } finally {
      setIsProcessing(false);
    }
  }, [handleValidationResult, options, t]);

  // Handle webcam capture
  const handleWebcamCapture = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    setValidationError(null);
    setValidationWarning(null);

    try {
      // Create photo data from captured image
      const filename = generatePhotoFilename('patient-capture');
      const response = await fetch(imageData);
      const blob = await response.blob();

      const newPhotoData: PhotoData = {
        base64: imageData,
        filename,
        size: blob.size,
        type: 'image/jpeg',
      };

      // Validate photo data
      const validationResult = validatePhotoData(newPhotoData);
      handleValidationResult(validationResult);

      if (validationResult.isValid) {
        setPhotoData(newPhotoData);
        options.onPhotoChange?.(newPhotoData);
        setIsWebcamModalOpen(false);
      }
    } catch (error) {
      console.error('Error processing captured photo:', error);
      setValidationError(t('registration.patient.photo.error.processing'));
      options.onValidationError?.(['registration.patient.photo.error.processing']);
    } finally {
      setIsProcessing(false);
    }
  }, [handleValidationResult, options, t]);

  // Handle remove photo
  const handleRemovePhoto = useCallback(() => {
    setPhotoData(null);
    setValidationError(null);
    setValidationWarning(null);
    options.onPhotoChange?.(null);
  }, [options]);

  // Open webcam modal
  const openWebcamModal = useCallback(() => {
    if (isWebcamAvailable) {
      setIsWebcamModalOpen(true);
    }
  }, [isWebcamAvailable]);

  // Close webcam modal
  const closeWebcamModal = useCallback(() => {
    setIsWebcamModalOpen(false);
    // Stop webcam stream if active
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
  }, [webcamStream]);

  // Clear validation messages
  const clearValidationMessages = useCallback(() => {
    setValidationError(null);
    setValidationWarning(null);
  }, []);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Start webcam stream
  const startWebcamStream = useCallback(async (): Promise<MediaStream | null> => {
    if (!isWebcamAvailable) {
      return null;
    }

    try {
      const constraints = getCameraConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setWebcamStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setValidationError(t('registration.patient.photo.error.camera'));
      options.onValidationError?.(['registration.patient.photo.error.camera']);
      return null;
    }
  }, [isWebcamAvailable, t, options]);

  // Stop webcam stream
  const stopWebcamStream = useCallback(() => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
  }, [webcamStream]);

  return {
    // State
    photoData,
    isProcessing,
    validationError,
    validationWarning,

    // Webcam state
    isWebcamModalOpen,
    isWebcamAvailable,
    webcamStream,

    // Actions
    handleFileUpload,
    handleWebcamCapture,
    handleRemovePhoto,
    openWebcamModal,
    closeWebcamModal,

    // Utilities
    clearValidationMessages,
    triggerFileInput,

    // Webcam utilities (exposed for modal component)
    startWebcamStream,
    stopWebcamStream,
  };
};

export default usePhotoCapture;
