import {
  Button,
  Modal,
  FileUploader,
  IconButton,
} from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import React, { useState, useCallback } from 'react';
import { useCamera } from '../../utils/useCamera';
import styles from './styles.module.scss';

interface PatientPhotoUploadProps {
  onPhotoConfirm: (base64Image: string) => void;
}

const toJpegDataUrl = (img: HTMLImageElement, quality = 1) => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg', quality);
};

const base64FromDataUrl = (dataUrl: string) => dataUrl.split(',')[1] || '';

const fileToObjectUrl = (file: File) => URL.createObjectURL(file);
const revokeObjectUrl = (url?: string) => {
  if (url) URL.revokeObjectURL(url);
};

export const PatientPhotoUpload: React.FC<PatientPhotoUploadProps> = ({
  onPhotoConfirm,
}) => {
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'idle' | 'capture' | 'upload'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [confirmedUrl, setConfirmedUrl] = useState<string | undefined>(
    undefined,
  );

  const { videoRef, start, stop, capture } = useCamera();

  const openUpload = () => {
    setIsModalOpen(true);
    setMode('upload');
    setPreviewUrl(confirmedUrl);
  };

  const openCapture = () => {
    setIsModalOpen(true);
    setMode('capture');
    handlePreview();
  };

  const handleModalClose = useCallback(() => {
    stop();
    setIsModalOpen(false);
    setMode('idle');
    if (!previewUrl) {
      setConfirmedUrl(undefined);
    }
  }, [previewUrl, stop]);

  const handleRemoveConfirmed = () => {
    setConfirmedUrl(undefined);
    onPhotoConfirm('');
  };

  const handleFileDelete = () => {
    setPreviewUrl(undefined);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.[0]) return;
    revokeObjectUrl(previewUrl);
    const url = fileToObjectUrl(files[0]);
    setPreviewUrl(url);
  };

  const handleCaptureClick = () => {
    const dataUrl = capture();
    if (dataUrl) {
      setPreviewUrl(dataUrl);
      stop();
    }
  };

  const handleConfirm = () => {
    if (!previewUrl) return;
    const img = new Image();
    img.onload = () => {
      const jpegDataUrl = toJpegDataUrl(img, 1);
      if (!jpegDataUrl) return;
      const base64 = base64FromDataUrl(jpegDataUrl);
      onPhotoConfirm(base64);
      setConfirmedUrl(jpegDataUrl);
      if (!previewUrl.startsWith('data:')) {
        revokeObjectUrl(previewUrl);
      }
      setIsModalOpen(false);
      setMode('idle');
    };
    img.src = previewUrl;
  };

  const handlePreview = async () => {
    stop();
    setPreviewUrl(undefined);
    try {
      await start();
    } catch {
      alert('Unable to access camera. Please check permissions.');
      handleModalClose();
    }
  };

  return (
    <>
      <div className={styles.photoUploadSection}>
        {confirmedUrl ? (
          <>
            <img src={confirmedUrl} alt="Patient" />
            <IconButton
              kind="ghost"
              label="Remove photo"
              size="sm"
              onClick={handleRemoveConfirmed}
              className={styles.removeButton}
            >
              ×
            </IconButton>
          </>
        ) : (
          <>
            <Button
              className={styles.wrapButton}
              kind="tertiary"
              size="sm"
              onClick={openUpload}
            >
              {t('CREATE_PATIENT_UPLOAD_PHOTO')}
            </Button>
            <Button
              kind="tertiary"
              size="sm"
              className={styles.wrapButton}
              onClick={openCapture}
            >
              {t('CREATE_PATIENT_CAPTURE_PHOTO')}
            </Button>
          </>
        )}
      </div>

      <Modal
        open={isModalOpen}
        onRequestClose={handleModalClose}
        passiveModal
        modalHeading="Upload Patient's Photo"
      >
        <Modal.Body>
          {mode === 'capture' && (
            <div className={styles.cameraContainer}>
              {!previewUrl && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={styles.imagePreviewContainer}
                  />
                  <Button
                    kind="primary"
                    onClick={handleCaptureClick}
                    className={styles.confirmButton}
                  >
                    Capture Photo
                  </Button>
                </>
              )}
            </div>
          )}

          {mode === 'upload' && (
            <FileUploader
              labelTitle=""
              key={isModalOpen ? 'open' : 'closed'}
              labelDescription="Maximum file size: 500KB"
              buttonLabel="Choose file"
              buttonKind="primary"
              accept={['image/*']}
              onChange={handleFileChange}
              onDelete={handleFileDelete}
              filenameStatus="edit"
            />
          )}

          {previewUrl && (
            <>
              <div className={styles.imagePreviewContainer}>
                <img src={previewUrl} alt="Preview" />
              </div>
              <Button
                kind="primary"
                onClick={handleConfirm}
                className={styles.confirmButton}
              >
                Confirm
              </Button>
              {mode === 'capture' && (
                <Button
                  kind="primary"
                  className={styles.confirmButton}
                  onClick={handlePreview}
                >
                  Retake
                </Button>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};
