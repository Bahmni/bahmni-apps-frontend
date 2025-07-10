/**
 * Person Attributes Form
 * Fourth step of patient creation wizard - person attributes
 */
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientFormData } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';

interface PersonAttributesFormProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  wizard: WizardContextValue;
}

export const PersonAttributesForm: React.FC<PersonAttributesFormProps> = ({
  formData,
  errors,
  updateField,
  wizard,
}) => {
  const { t } = useTranslation();

  // Attributes are optional, so always valid for now
  const stepValidation = useMemo(() => {
    return { isValid: true, errors: [], isComplete: true };
  }, []);

  // Update wizard validation when step validation changes
  useEffect(() => {
    wizard.actions.setStepValidation('attributes', stepValidation);
  }, [stepValidation, wizard.actions]);

  return (
    <div className="person-attributes-form">
      <div className="person-attributes-form__section">
        <h3 className="person-attributes-form__section-title">
          {t('registration.patient.attributes.title')}
        </h3>
        <p className="person-attributes-form__description">
          {t('registration.patient.attributes.description')}
        </p>

        {/* Placeholder for dynamic attributes */}
        <div className="person-attributes-form__placeholder">
          <p>{t('registration.patient.attributes.placeholder')}</p>
        </div>
      </div>
    </div>
  );
};

export default PersonAttributesForm;
