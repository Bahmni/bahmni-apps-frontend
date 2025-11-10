import {
  Button,
  Modal,
  FileUploader,
} from '@bahmni-frontend/bahmni-design-system';
import { useTranslation, useCamera } from '@bahmni-frontend/bahmni-services';
import React, { useState, useCallback } from 'react';
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
  const [fileSizeError, setFileSizeError] = useState<string>('');

  const MAX_FILE_SIZE = 500 * 1024;

  const { videoRef, start, stop, capture } = useCamera();

  const openUpload = () => {
    setIsModalOpen(true);
    setMode('upload');
    setPreviewUrl(confirmedUrl);
  };

  const openCapture = () => {
    setMode('capture');
    handlePreview();
    setFileSizeError('');
  };

  const handleModalClose = useCallback(() => {
    stop();
    setIsModalOpen(false);
    setFileSizeError('');
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
    setFileSizeError('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.[0]) return;

    const file = files[0];
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeKB = Math.round(file.size / 1024);
      setFileSizeError(
        t('CREATE_PATIENT_UPLOAD_PHOTO_FILE_SIZE_ERROR', {
          fileSize: `${fileSizeKB}KB`,
        }),
      );
      setPreviewUrl(undefined);
      return;
    }

    setFileSizeError('');

    revokeObjectUrl(previewUrl);
    const url = fileToObjectUrl(file);
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
      setIsModalOpen(true);
    } catch {
      alert(t('CREATE_PATIENT_CAMERA_ACCESS_ERROR'));
      handleModalClose();
    }
  };

  return (
    <>
      <div className={styles.photoUploadSection}>
        {confirmedUrl ? (
          <>
            <img src={confirmedUrl} alt="Patient" />
            <Button
              kind="ghost"
              size="sm"
              onClick={handleRemoveConfirmed}
              title={t('CREATE_PATIENT_UPLOAD_PHOTO_REMOVE')}
              className={styles.removeButton}
            >
              ×
            </Button>
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
        modalHeading={
          mode == 'upload'
            ? t('CREATE_PATIENT_UPLOAD_PHOTO_MODAL_HEADING')
            : t('CREATE_PATIENT_CAPTURE_PHOTO_MODAL_HEADING')
        }
      >
        <Modal.Body>
          {mode === 'capture' && (
            <div>
              {!previewUrl && (
                <>
                  <div className={styles.imagePreviewContainer}>
                    <video ref={videoRef} autoPlay playsInline />
                  </div>
                  <div className={styles.buttonGroup}>
                    <Button kind="primary" onClick={handleCaptureClick}>
                      {t('CREATE_PATIENT_CAPTURE_PHOTO')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {mode === 'upload' && (
            <>
              <FileUploader
                labelTitle=""
                key={isModalOpen ? 'open' : 'closed'}
                labelDescription={t(
                  'CREATE_PATIENT_UPLOAD_PHOTO_FILE_SIZE_LIMIT',
                )}
                buttonLabel={t('CREATE_PATIENT_UPLOAD_PHOTO_CHOOSE_FILE')}
                buttonKind="primary"
                accept={['image/*']}
                onChange={handleFileChange}
                onDelete={handleFileDelete}
                filenameStatus="edit"
              />
              {fileSizeError && (
                <div className={styles.errorMessage}>{fileSizeError}</div>
              )}
            </>
          )}

          {previewUrl && (
            <>
              <div className={styles.imagePreviewContainer}>
                <img src={previewUrl} alt="Preview" />
              </div>
              <div className={styles.buttonGroup}>
                <Button kind="primary" onClick={handleConfirm}>
                  {t('CREATE_PATIENT_UPLOAD_PHOTO_CONFIRM')}
                </Button>
                {mode === 'capture' && (
                  <Button kind="primary" onClick={handlePreview}>
                    {t('CREATE_PATIENT_UPLOAD_PHOTO_RETAKE')}
                  </Button>
                )}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};
