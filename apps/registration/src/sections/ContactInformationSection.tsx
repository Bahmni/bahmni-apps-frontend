import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import type { PatientFormData } from '../models/patientForm';
import styles from '../pages/createPatientPage/styles/index.module.scss';

interface ContactInformationSectionProps {
  formData: PatientFormData;
  onPhoneChange: (
    field: 'phoneNumber' | 'altPhoneNumber',
    value: string,
  ) => void;
}

export const ContactInformationSection = ({
  formData,
  onPhoneChange,
}: ContactInformationSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.formSection}>
      <span className={styles.formSectionTitle}>
        {t('CREATE_PATIENT_SECTION_CONTACT_INFO')}
      </span>
      <div className={styles.row}>
        <div className={styles.phoneNumberField}>
          <TextInput
            id="phone-number"
            labelText={t('CREATE_PATIENT_PHONE_NUMBER')}
            placeholder={t('CREATE_PATIENT_PHONE_NUMBER_PLACEHOLDER')}
            value={formData.phoneNumber}
            onChange={(e) => onPhoneChange('phoneNumber', e.target.value)}
          />
        </div>
        <div className={styles.phoneNumberField}>
          <TextInput
            id="alt-phone-number"
            labelText={t('CREATE_PATIENT_ALT_PHONE_NUMBER')}
            placeholder={t('CREATE_PATIENT_ALT_PHONE_NUMBER')}
            value={formData.altPhoneNumber}
            onChange={(e) => onPhoneChange('altPhoneNumber', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
