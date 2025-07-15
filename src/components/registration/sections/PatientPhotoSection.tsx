/**
 * Patient Photo Section Component
 *
 * Handles photo capture/upload functionality for patient registration
 * using Carbon design components. Based on the photo-container from
 * the AngularJS implementation.
 */

import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FileUploader, Modal, Loading } from '@carbon/react';
import { Camera, Upload, TrashCan, Edit } from '@carbon/icons-react';
import { PatientPhoto, ValidationError } from '@types/registration';
import { useNotification } from '@hooks/useNotification';
import * as styles from './styles/PatientPhotoSection.module.scss';

interface PatientPhotoSectionProps {
  data: PatientPhoto;
  onChange: (photo: PatientPhoto) => void;
  errors: ValidationError[];
  disabled?: boolean;
  disablePhotoCapture?: boolean;
}

const PatientPhotoSection: React.FC<PatientPhotoSectionProps> = ({
  data,
  onChange,
  errors,
  disabled = false,
  disablePhotoCapture = false,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  // State for camera modal and loading
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Refs for camera functionality
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default image path (as per user preference)
  const defaultImage = '/blank-user.gif';

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        addNotification({
          type: 'error',
          title: t('REGISTRATION_ERROR'),
          message: t('REGISTRATION_ERROR_INVALID_IMAGE_TYPE'),
        });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        addNotification({
          type: 'error',
          title: t('REGISTRATION_ERROR'),
          message: t('REGISTRATION_ERROR_IMAGE_TOO_LARGE'),
        });
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        onChange({
          image: base64String,
          hasPhoto: true,
        });

        addNotification({
          type: 'success',
          title: t('REGISTRATION_SUCCESS'),
          message: t('REGISTRATION_PHOTO_UPLOADED_SUCCESSFULLY'),
        });
      };

      reader.onerror = () => {
        addNotification({
          type: 'error',
          title: t('REGISTRATION_ERROR'),
          message: t('REGISTRATION_ERROR_PHOTO_UPLOAD_FAILED'),
        });
      };

      reader.readAsDataURL(file);
    },
    [onChange, addNotification, t],
  );

  /**
   * Start camera for photo capture
   */
  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 320,
          height: 240,
          facingMode: 'user', // Front camera for selfies
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      addNotification({
        type: 'error',
        title: t('REGISTRATION_ERROR'),
        message: t('REGISTRATION_ERROR_CAMERA_ACCESS_DENIED'),
      });
      setIsCameraModalOpen(false);
    } finally {
      setIsCapturing(false);
    }
  }, [addNotification, t]);

  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  /**
   * Capture photo from camera
   */
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

    // Convert to base64
    const base64String = canvas.toDataURL('image/jpeg', 0.8);

    onChange({
      image: base64String,
      hasPhoto: true,
    });

    // Close modal and stop camera
    setIsCameraModalOpen(false);
    stopCamera();

    addNotification({
      type: 'success',
      title: t('REGISTRATION_SUCCESS'),
      message: t('REGISTRATION_PHOTO_CAPTURED_SUCCESSFULLY'),
    });
  }, [onChange, stopCamera, addNotification, t]);

  /**
   * Remove photo
   */
  const removePhoto = useCallback(() => {
    onChange({
      image: undefined,
      hasPhoto: false,
    });

    addNotification({
      type: 'info',
      title: t('REGISTRATION_INFO'),
      message: t('REGISTRATION_PHOTO_REMOVED'),
    });
  }, [onChange, addNotification, t]);

  /**
   * Open camera modal
   */
  const openCameraModal = useCallback(() => {
    setIsCameraModalOpen(true);
    startCamera();
  }, [startCamera]);

  /**
   * Close camera modal
   */
  const closeCameraModal = useCallback(() => {
    setIsCameraModalOpen(false);
    stopCamera();
  }, [stopCamera]);

  // Don't render if photo capture is disabled
  if (disablePhotoCapture) {
    return null;
  }

  const currentImage = data.image || defaultImage;
  const hasCustomPhoto = data.hasPhoto && data.image;

  return (
    <div className={styles.photoSection}>
      <div className={styles.photoContainer}>
        {/* Photo Display */}
        <div className={styles.photoWrapper}>
          <img
            src={currentImage}
            alt={t('REGISTRATION_PATIENT_PHOTO')}
            className={styles.patientImage}
            onError={(e) => {
              // Fallback to default image if loading fails
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />

          {/* Photo Actions Overlay */}
          {!disabled && (
            <div className={styles.photoActions}>
              {hasCustomPhoto && (
                <Button
                  kind="danger--tertiary"
                  size="sm"
                  renderIcon={TrashCan}
                  iconDescription={t('REGISTRATION_REMOVE_PHOTO')}
                  onClick={removePhoto}
                  className={styles.actionButton}
                />
              )}
            </div>
          )}
        </div>

        {/* Photo Controls */}
        {!disabled && (
          <div className={styles.photoControls}>
            {/* Camera Capture Button */}
            <Button
              kind="tertiary"
              size="sm"
              renderIcon={Camera}
              onClick={openCameraModal}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <>
                  <Loading size="sm" />
                  {t('REGISTRATION_STARTING_CAMERA')}
                </>
              ) : (
                t('REGISTRATION_CAPTURE_PHOTO')
              )}
            </Button>

            {/* File Upload Button */}
            <Button
              kind="tertiary"
              size="sm"
              renderIcon={Upload}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('REGISTRATION_UPLOAD_PHOTO')}
            </Button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Camera Modal */}
      <Modal
        open={isCameraModalOpen}
        onRequestClose={closeCameraModal}
        modalHeading={t('REGISTRATION_CAPTURE_PHOTO')}
        primaryButtonText={t('REGISTRATION_CAPTURE')}
        secondaryButtonText={t('CANCEL')}
        onRequestSubmit={capturePhoto}
        size="sm"
      >
        <div className={styles.cameraModal}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={styles.cameraVideo}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {isCapturing && (
            <div className={styles.cameraLoading}>
              <Loading />
              <p>{t('REGISTRATION_STARTING_CAMERA')}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PatientPhotoSection;
