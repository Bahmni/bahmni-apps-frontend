import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import { useCallback, useImperativeHandle, useState } from 'react';
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

  const [formData, setFormData] = useState<AdditionalData>({
    email: initialData?.email ?? '',
  });

  const [emailError, setEmailError] = useState<string>('');

  const handleEmailChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, email: value }));

      if (emailError) {
        setEmailError('');
      }
    },
    [emailError],
  );

  const validate = useCallback((): boolean => {
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setEmailError(
          t('CREATE_PATIENT_VALIDATION_EMAIL_INVALID') ??
            'Invalid email format',
        );
        return false;
      }
    }

    setEmailError('');
    return true;
  }, [formData.email, t]);

  const getData = useCallback((): AdditionalData => {
    return formData;
  }, [formData]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  return (
    <div className={styles.formSection}>
      <span className={styles.formSectionTitle}>
        {t('CREATE_PATIENT_SECTION_ADDITIONAL_INFO')}
      </span>
      <div className={styles.row}>
        <div className={styles.emailField}>
          <TextInput
            id="email"
            labelText={t('CREATE_PATIENT_EMAIL')}
            placeholder={t('CREATE_PATIENT_EMAIL_PLACEHOLDER')}
            value={formData.email}
            invalid={!!emailError}
            invalidText={emailError}
            onChange={(e) => handleEmailChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

AdditionalInfo.displayName = 'AdditionalInfo';

export default AdditionalInfo;
