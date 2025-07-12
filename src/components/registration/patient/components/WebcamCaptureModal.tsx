/**
 * Webcam Capture Modal
 * Modal component for capturing patient photos using webcam
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Button,
  AspectRatio,
  Loading,
  InlineNotification,
} from '@carbon/react';
import { Camera, Redo } from '@carbon/icons-react';
import {
  getCameraConstraints,
  canvasToBase64,
  generatePhotoFilename,
} from '../../../../utils/photoValidation';

interface WebcamCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => Promise<void>;
  isProcessing: boolean;
}

export const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({
  open,
  onClose,
  onCapture,
  isProcessing,
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Start webcam when modal opens
  useEffect(() => {
    if (open && !stream) {
      startWebcam();
    }

    // Cleanup when modal closes
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open, stream]);

  // Start webcam stream
  const startWebcam = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const constraints = getCameraConstraints();
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(t('registration.patient.photo.error.camera'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Stop webcam stream
  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64
    const imageData = canvasToBase64(canvas, 0.8);
    setCapturedImage(imageData);
  }, []);

  // Confirm and submit captured photo
  const confirmCapture = useCallback(async () => {
    if (!capturedImage) return;

    try {
      await onCapture(capturedImage);
      setCapturedImage(null);
      stopWebcam();
    } catch (error) {
      console.error('Error submitting captured photo:', error);
      setError(t('registration.patient.photo.error.processing'));
    }
  }, [capturedImage, onCapture, stopWebcam, t]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setError(null);
  }, []);

  // Handle modal close
  const handleClose = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    stopWebcam();
    onClose();
  }, [onClose, stopWebcam]);

  const modalProps = {
    open,
    onRequestClose: handleClose,
    modalHeading: t('registration.patient.photo.modal.title'),
    primaryButtonText: capturedImage
      ? t('registration.patient.photo.modal.capture')
      : t('registration.patient.photo.modal.capture'),
    secondaryButtonText: t('registration.patient.photo.modal.cancel'),
    onRequestSubmit: capturedImage ? confirmCapture : capturePhoto,
    preventCloseOnClickOutside: true,
    hasScrollingContent: false,
    size: 'md' as const,
  };

  return (
    <Modal {...modalProps}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Loading state */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <Loading description={t('registration.patient.photo.webcamAccess')} />
          </div>
        )}

        {/* Error state */}
        {error && (
          <InlineNotification
            kind="error"
            title={t('ERROR_DEFAULT_TITLE')}
            subtitle={error}
            hideCloseButton
          />
        )}

        {/* Camera preview or captured image */}
        {!isLoading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <AspectRatio ratio="4x3">
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {!capturedImage ? (
                  // Live video preview
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      backgroundColor: '#000',
                    }}
                  />
                ) : (
                  // Captured image preview
                  <img
                    src={capturedImage}
                    alt="Captured photo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                )}
              </div>
            </AspectRatio>

            {/* Retake button for captured image */}
            {capturedImage && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  kind="secondary"
                  renderIcon={Redo}
                  onClick={retakePhoto}
                  disabled={isProcessing}
                >
                  {t('registration.patient.photo.modal.retake')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </Modal>
  );
};

export default WebcamCaptureModal;
