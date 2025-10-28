import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import type { PatientFormData } from '../models/patientForm';
import styles from '../pages/createPatientPage/styles/index.module.scss';

interface AdditionalInformationSectionProps {
  formData: PatientFormData;
  onInputChange: (field: keyof PatientFormData, value: string) => void;
}

export const AdditionalInformationSection = ({
  formData,
  onInputChange,
}: AdditionalInformationSectionProps) => {
  const { t } = useTranslation();

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
            onChange={(e) => onInputChange('email', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
