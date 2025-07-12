/**
 * Patient Photo Capture
 * Fifth step of patient creation wizard - photo upload/capture
 */
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientFormData } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';

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

  // Photo is optional, so always valid
  const stepValidation = useMemo(() => {
    return { isValid: true, errors: [], isComplete: true };
  }, []);

  // Update wizard validation when step validation changes
  useEffect(() => {
    wizard.actions.setStepValidation('photo', stepValidation);
  }, [stepValidation, wizard.actions]);

  return (
    <div className="patient-photo-capture">
      <div className="patient-photo-capture__section">
        <h3 className="patient-photo-capture__section-title">
          {t('registration.patient.photo.title')}
        </h3>
        <p className="patient-photo-capture__description">
          {t('registration.patient.photo.description')}
        </p>

        {/* Placeholder for photo capture */}
        <div className="patient-photo-capture__placeholder">
          <p>{t('registration.patient.photo.placeholder')}</p>
        </div>
      </div>
    </div>
  );
};

export default PatientPhotoCapture;
