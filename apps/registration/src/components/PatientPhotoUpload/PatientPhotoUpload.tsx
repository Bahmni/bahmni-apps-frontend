import {
  Button,
  Modal,
  FileUploader,
  IconButton,
} from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import { useState } from 'react';
import styles from './styles.module.scss';

interface PatientPhotoUploadProps {
  onPhotoConfirm: (base64Image: string) => void;
}

export const PatientPhotoUpload: React.FC<PatientPhotoUploadProps> = ({
  onPhotoConfirm,
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [confirmedPhotoUrl, setConfirmedPhotoUrl] = useState<string>();

  const handleUploadClick = () => {
    setIsModalOpen(true);
    setPreviewUrl(confirmedPhotoUrl);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (!previewUrl) {
      setConfirmedPhotoUrl(undefined);
    }
  };

  const handleFileDelete = () => {
    setPreviewUrl(undefined);
  };

  const handleRemovePhoto = () => {
    setConfirmedPhotoUrl(undefined);
    onPhotoConfirm('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleConfirm = () => {
    if (previewUrl) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);

          const jpegDataUrl = canvas.toDataURL('image/jpeg', 1);
          const base64Data = jpegDataUrl.split(',')[1];

          onPhotoConfirm(base64Data);
        }
      };
      img.src = previewUrl;
      setConfirmedPhotoUrl(previewUrl);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <div className={styles.photoUploadSection}>
        {confirmedPhotoUrl ? (
          <>
            <img src={confirmedPhotoUrl} alt="Patient" />
            <IconButton
              kind="ghost"
              label="Remove photo"
              size="sm"
              onClick={handleRemovePhoto}
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
              onClick={handleUploadClick}
            >
              {t('CREATE_PATIENT_UPLOAD_PHOTO')}
            </Button>
            <Button kind="tertiary" size="sm" className={styles.wrapButton}>
              {t('CREATE_PATIENT_CAPTURE_PHOTO')}
            </Button>
          </>
        )}
      </div>

      <Modal
        open={isModalOpen}
        onRequestClose={handleCloseModal}
        passiveModal
        modalHeading="Upload Patient's Photo"
      >
        <Modal.Body>
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
          {previewUrl && (
            <div className={styles.imagePreviewContainer}>
              <img src={previewUrl} alt="Preview" />
            </div>
          )}
          <Button
            kind="primary"
            onClick={handleConfirm}
            disabled={!previewUrl}
            className={styles.confirmButton}
          >
            Confirm Photo
          </Button>
        </Modal.Body>
      </Modal>
    </>
  );
};
