/**
 * Patient Photo Capture
 * Fifth step of patient creation wizard - photo upload/capture
 * Rewritten to use Carbon components and default styling
 */
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack,
  Layer,
  Heading,
  Grid,
  Column,
  Button,
  ButtonSet,
  InlineNotification,
  Loading,
  AspectRatio,
  Tile,
  FileUploaderDropContainer,
  FileUploaderItem,
} from '@carbon/react';
import { Camera, Upload, TrashCan } from '@carbon/icons-react';
import { PatientFormData } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';
import { usePhotoCapture } from '../../../hooks/usePhotoCapture';
import { PhotoData } from '../../../utils/photoValidation';
import { WebcamCaptureModal } from './components/WebcamCaptureModal';

interface PatientPhotoCaptureProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  wizard: WizardContextValue;
}

export const PatientPhotoCapture: React.FC<PatientPhotoCaptureProps> = ({
  formData,
  errors,
  updateField,
  wizard,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Photo capture hook
  const {
    photoData,
    isProcessing,
    validationError,
    validationWarning,
    isWebcamModalOpen,
    isWebcamAvailable,
    handleFileUpload,
    handleWebcamCapture,
    handleRemovePhoto,
    openWebcamModal,
    closeWebcamModal,
    clearValidationMessages,
  } = usePhotoCapture({
    onPhotoChange: (photo: PhotoData | null) => {
      updateField('photo', photo);
      if (photo) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    },
    onValidationError: (errors) => {
      // Validation errors are handled by the hook
      console.log('Validation errors:', errors);
    },
    onValidationWarning: (warnings) => {
      // Validation warnings are handled by the hook
      console.log('Validation warnings:', warnings);
    },
  });

  // Initialize photo data from form data
  useEffect(() => {
    if (formData.photo && !photoData) {
      // If form has photo data but hook doesn't, sync it
      // This handles the case where user navigates back to this step
    }
  }, [formData.photo, photoData]);

  // Photo is optional, so always valid
  const stepValidation = useMemo(() => {
    return {
      isValid: true,
      errors: [],
      isComplete: !!photoData || !!formData.photo
    };
  }, [photoData, formData.photo]);

  // Update wizard validation when step validation changes
  useEffect(() => {
    wizard.actions.setStepValidation('photo', stepValidation);
  }, [stepValidation, wizard.actions]);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Handle drag and drop
  const handleDropContainerFiles = useCallback((event: React.SyntheticEvent<HTMLElement>, { addedFiles }: { addedFiles: File[] }) => {
    if (addedFiles.length > 0) {
      handleFileUpload(addedFiles);
    }
  }, [handleFileUpload]);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const currentPhoto = photoData || formData.photo;

  return (
    <Stack gap={6}>
      <Layer>
        <Stack gap={5}>
          <Heading>{t('registration.patient.photo.title')}</Heading>
          <p>{t('registration.patient.photo.description')}</p>

          <Grid>
            <Column md={4} lg={8}>
              {!currentPhoto ? (
                // Upload area when no photo is present
                <Stack gap={4}>
                  <FileUploaderDropContainer
                    accept={['.jpg', '.jpeg', '.png', '.webp']}
                    onAddFiles={handleDropContainerFiles}
                    labelText={t('registration.patient.photo.dragDrop')}
                    multiple={false}
                    disabled={isProcessing}
                  />

                  {/* Action buttons */}
                  <ButtonSet>
                    <Button
                      kind="secondary"
                      renderIcon={Camera}
                      onClick={openWebcamModal}
                      disabled={!isWebcamAvailable || isProcessing}
                    >
                      {t('registration.patient.photo.capture')}
                    </Button>
                    <Button
                      kind="primary"
                      renderIcon={Upload}
                      onClick={triggerFileInput}
                      disabled={isProcessing}
                    >
                      {t('registration.patient.photo.upload')}
                    </Button>
                  </ButtonSet>
                </Stack>
              ) : (
                // Photo preview when photo is present
                <Stack gap={4}>
                  <AspectRatio ratio="3x4">
                    <Tile>
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img
                          src={currentPhoto.base64}
                          alt="Patient photo"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '4px',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            display: 'flex',
                            gap: '8px',
                          }}
                        >
                          <Button
                            kind="ghost"
                            size="sm"
                            renderIcon={TrashCan}
                            onClick={handleRemovePhoto}
                            iconDescription={t('registration.patient.photo.remove')}
                            hasIconOnly
                          />
                        </div>
                      </div>
                    </Tile>
                  </AspectRatio>

                  {/* Photo info */}
                  <div style={{ fontSize: '12px', color: '#6f6f6f' }}>
                    <p>{currentPhoto.filename}</p>
                    <p>{Math.round(currentPhoto.size / 1024)} KB</p>
                    {currentPhoto.dimensions && (
                      <p>
                        {currentPhoto.dimensions.width} x {currentPhoto.dimensions.height}
                      </p>
                    )}
                  </div>

                  {/* Replace photo buttons */}
                  <ButtonSet>
                    <Button
                      kind="secondary"
                      renderIcon={Camera}
                      onClick={openWebcamModal}
                      disabled={!isWebcamAvailable || isProcessing}
                    >
                      {t('registration.patient.photo.capture')}
                    </Button>
                    <Button
                      kind="tertiary"
                      renderIcon={Upload}
                      onClick={triggerFileInput}
                      disabled={isProcessing}
                    >
                      {t('registration.patient.photo.upload')}
                    </Button>
                  </ButtonSet>
                </Stack>
              )}
            </Column>
          </Grid>
        </Stack>
      </Layer>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Webcam capture modal */}
      <WebcamCaptureModal
        open={isWebcamModalOpen}
        onClose={closeWebcamModal}
        onCapture={handleWebcamCapture}
        isProcessing={isProcessing}
      />

      {/* Processing state */}
      {isProcessing && (
        <Loading description={t('registration.patient.photo.processing')} />
      )}

      {/* Success message */}
      {showSuccess && (
        <InlineNotification
          kind="success"
          title={t('registration.patient.photo.success')}
          hideCloseButton
          lowContrast
        />
      )}

      {/* Validation error */}
      {validationError && (
        <InlineNotification
          kind="error"
          title={t('ERROR_DEFAULT_TITLE')}
          subtitle={validationError}
          onCloseButtonClick={clearValidationMessages}
        />
      )}

      {/* Validation warning */}
      {validationWarning && (
        <InlineNotification
          kind="warning"
          title={t('common.warning')}
          subtitle={validationWarning}
          onCloseButtonClick={clearValidationMessages}
        />
      )}
    </Stack>
  );
};

export default PatientPhotoCapture;
