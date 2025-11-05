import {
  Button,
  Modal,
  FileUploader,
} from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import { useState, useEffect } from 'react';
import styles from './styles.module.scss';

export const PatientPhotoUpload: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleUploadClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFile(undefined);
    setPreviewUrl(undefined);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const file = files[0];
      setSelectedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setSelectedFile(undefined);
      setPreviewUrl(undefined);
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      handleCloseModal();
    }
  };

  return (
    <div className={styles.photoUploadSection}>
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
      <Modal
        open={isModalOpen}
        onRequestClose={handleCloseModal}
        passiveModal
        modalHeading="Upload Patient's Photo"
      >
        <Modal.Body>
          <FileUploader
            labelTitle=""
            labelDescription=""
            buttonLabel="Choose file"
            buttonKind="primary"
            accept={['image/*']}
            multiple={false}
            onChange={handleFileChange}
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
            disabled={!selectedFile}
            className={styles.confirmButton}
          >
            Confirm Photo
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  );
};
