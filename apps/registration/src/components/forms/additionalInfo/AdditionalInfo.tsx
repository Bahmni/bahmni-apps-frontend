import { TextInput } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useCallback, useImperativeHandle, useState, useMemo } from 'react';
import { useRegistrationConfig } from '../../../hooks/useRegistrationConfig';
import type { AdditionalData } from '../../../models/patient';
import styles from '../../../pages/createPatientPage/styles/index.module.scss';

export interface AdditionalInfoRef {
  validate: () => boolean;
  getData: () => AdditionalData;
}

interface AdditionalInfoProps {
  initialData?: AdditionalData;
  ref?: React.Ref<AdditionalInfoRef>;
}

export const AdditionalInfo = ({ initialData, ref }: AdditionalInfoProps) => {
  const { t } = useTranslation();
  const { registrationConfig } = useRegistrationConfig();

  const fieldValidationConfig = registrationConfig?.fieldValidation;
  const pattern = fieldValidationConfig?.['email']?.pattern ?? '^[a-zA-Z\\s]*$';

  const additionalInfoConfig =
    registrationConfig?.patientInformation?.additionalPatientInformation;
  const expectedFields = additionalInfoConfig?.expectedFields ?? [];
  const sectionTitle = t('CREATE_PATIENT_SECTION_ADDITIONAL_INFO');

  // Initialize form data based on expected fields
  const initialFormData = useMemo(() => {
    const data: AdditionalData = {};
    expectedFields.forEach((field) => {
      data[field.field] = initialData?.[field.field] ?? '';
    });
    return data;
  }, [expectedFields, initialData]);

  const [formData, setFormData] = useState<AdditionalData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = useCallback(
    (fieldName: string, value: string) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));

      // Clear error when user types
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: '' }));
      }
    },
    [errors],
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    expectedFields.forEach((fieldConfig) => {
      const fieldName = fieldConfig.field;
      const value = formData[fieldName];

      if (fieldName === 'email' && value) {
        const emailRegex = new RegExp(pattern);
        if (!emailRegex.test(value as string)) {
          newErrors[fieldName] =
            fieldValidationConfig?.['email']?.errorMessage ??
            t('CREATE_PATIENT_VALIDATION_EMAIL_INVALID') ??
            'Invalid email format';
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [expectedFields, formData, pattern, fieldValidationConfig, t]);

  const getData = useCallback((): AdditionalData => {
    return formData;
  }, [formData]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  // If no fields are configured, don't render the section
  if (expectedFields.length === 0) {
    return null;
  }

  return (
    <div className={styles.formSection}>
      <span className={styles.formSectionTitle}>{t(sectionTitle)}</span>
      <div className={styles.row}>
        {expectedFields.map((fieldConfig) => {
          const fieldName = fieldConfig.field;
          const value = formData[fieldName] ?? '';
          const error = errors[fieldName] || '';
          const label = t(fieldConfig.translationKey);
          return (
            <div key={fieldName} className={styles.emailField}>
              <TextInput
                id={fieldName}
                labelText={label}
                placeholder={label}
                value={value as string}
                invalid={!!error}
                invalidText={error}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

AdditionalInfo.displayName = 'AdditionalInfo';

export default AdditionalInfo;
