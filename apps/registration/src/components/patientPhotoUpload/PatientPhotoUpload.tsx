import { Button, Modal, FileUploader, IconButton } from '@bahmni/design-system';
import { useTranslation, useCamera } from '@bahmni/services';
import { Close } from '@carbon/icons-react';
import React, { useState, useCallback, useEffect } from 'react';
import styles from './styles.module.scss';

interface PatientPhotoUploadProps {
  onPhotoConfirm: (base64Image: string) => void;
  initialPhoto?: string;
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
  initialPhoto,
}) => {
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'idle' | 'capture' | 'upload'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string>('');
  const [confirmedUrl, setConfirmedUrl] = useState<string | undefined>(
    undefined,
  );
  const [fileSizeError, setFileSizeError] = useState<string>('');

  useEffect(() => {
    if (initialPhoto) {
      setConfirmedUrl(initialPhoto);
    }
  }, [initialPhoto]);

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
    setFileName('');
    if (!previewUrl) {
      setConfirmedUrl(undefined);
    }
  }, [previewUrl, stop]);

  const handleRemoveConfirmed = () => {
    setConfirmedUrl(undefined);
    onPhotoConfirm('');
    setFileName('');
  };

  const handleFileDelete = () => {
    setPreviewUrl(undefined);
    setFileSizeError('');
    setFileName('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.[0]) return;

    const file = files[0];
    setFileName(file.name);
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeKB = Math.round(file.size / 1000);
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
    }
    stop();
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
    setPreviewUrl(undefined);
    try {
      await start();
      setIsModalOpen(true);
    } catch {
      alert(t('CREATE_PATIENT_CAMERA_ACCESS_ERROR'));
      handleModalClose();
    }
  };

  const renderCaptureContent = () => {
    return !previewUrl ? (
      <>
        <div
          className={styles.imagePreviewContainer}
          data-testid="capture-video-container"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            data-testid="capture-video"
          />
        </div>
        <div className={styles.buttonGroup} data-testid="capture-button-group">
          <Button
            kind="primary"
            onClick={handleCaptureClick}
            className={styles.button}
            data-testid="capture-photo-button"
          >
            {t('CREATE_PATIENT_CAPTURE_PHOTO')}
          </Button>
        </div>
      </>
    ) : (
      <>
        <div
          className={styles.imagePreviewContainer}
          data-testid="capture-preview-container"
        >
          <img
            src={previewUrl}
            alt="Preview"
            data-testid="capture-preview-image"
          />
        </div>
        <div
          className={styles.buttonGroup}
          data-testid="capture-confirm-button-group"
        >
          <Button
            kind="primary"
            onClick={handleConfirm}
            className={styles.button}
            data-testid="capture-confirm-button"
          >
            {t('CREATE_PATIENT_UPLOAD_PHOTO_CONFIRM')}
          </Button>
          <Button
            kind="primary"
            onClick={handlePreview}
            className={styles.button}
            data-testid="capture-retake-button"
          >
            {t('CREATE_PATIENT_UPLOAD_PHOTO_RETAKE')}
          </Button>
        </div>
      </>
    );
  };

  const renderUploadContent = () => {
    return (
      <>
        <FileUploader
          labelTitle=""
          title={fileName}
          key={isModalOpen ? 'open' : 'closed'}
          labelDescription={t('CREATE_PATIENT_UPLOAD_PHOTO_FILE_SIZE_LIMIT')}
          buttonLabel={t('CREATE_PATIENT_UPLOAD_PHOTO_CHOOSE_FILE')}
          buttonKind="primary"
          accept={['image/*']}
          onChange={handleFileChange}
          onDelete={handleFileDelete}
          filenameStatus="edit"
          data-testid="file-uploader"
        />
        {!fileName && (
          <div
            className={styles.noFileChosen}
            data-testid="no-file-chosen-message"
          >
            {t('CREATE_PATIENT_NO_FILE_CHOSEN')}
          </div>
        )}
        <div
          className={styles.errorMessage}
          data-testid="file-size-error-message"
        >
          {fileSizeError}
        </div>
        <div
          className={styles.imagePreviewContainer}
          data-testid="upload-preview-container"
        >
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              data-testid="upload-preview-image"
            />
          )}
        </div>
        <div className={styles.buttonGroup} data-testid="upload-button-group">
          <Button
            kind="primary"
            onClick={handleConfirm}
            disabled={!previewUrl}
            className={styles.button}
            data-testid="upload-confirm-button"
          >
            {t('CREATE_PATIENT_UPLOAD_PHOTO_CONFIRM')}
          </Button>
        </div>
      </>
    );
  };

  return (
    <>
      <div
        className={styles.photoUploadSection}
        data-testid="patient-photo-upload-section"
      >
        {confirmedUrl ? (
          <>
            <div className={styles.removeButtonWrapper}>
              <IconButton
                kind="ghost"
                size="xs"
                onClick={handleRemoveConfirmed}
                label={t('CREATE_PATIENT_UPLOAD_PHOTO_REMOVE')}
                data-testid="patient-photo-remove-button"
              >
                <Close />
              </IconButton>
            </div>
            <img
              src={confirmedUrl}
              alt="Patient"
              data-testid="patient-photo-preview"
            />
          </>
        ) : (
          <>
            <Button
              className={styles.wrapButton}
              kind="tertiary"
              size="sm"
              onClick={openUpload}
              data-testid="patient-photo-upload-button"
            >
              {t('CREATE_PATIENT_UPLOAD_PHOTO')}
            </Button>
            <Button
              kind="tertiary"
              size="sm"
              className={styles.wrapButton}
              onClick={openCapture}
              data-testid="patient-photo-capture-button"
            >
              {t('CREATE_PATIENT_CAPTURE_PHOTO')}
            </Button>
          </>
        )}
      </div>

      <Modal
        className={styles.patientPhoto}
        open={isModalOpen}
        onRequestClose={handleModalClose}
        passiveModal
        modalHeading={
          mode == 'upload'
            ? t('CREATE_PATIENT_UPLOAD_PHOTO_MODAL_HEADING')
            : t('CREATE_PATIENT_CAPTURE_PHOTO_MODAL_HEADING')
        }
        data-testid="patient-photo-modal"
      >
        <Modal.Body data-testid="patient-photo-modal-body">
          {mode === 'capture' && renderCaptureContent()}
          {mode === 'upload' && renderUploadContent()}
        </Modal.Body>
      </Modal>
    </>
  );
};
