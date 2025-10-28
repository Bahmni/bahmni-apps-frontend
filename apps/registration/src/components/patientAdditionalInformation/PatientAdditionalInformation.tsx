import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import styles from '../../pages/createPatientPage/styles/index.module.scss';

export interface AdditionalData {
  email: string;
}

interface AdditionalInformationProps {
  formData: AdditionalData;
  onInputChange: (field: string, value: string) => void;
}

export const PatientAdditionalInformation: React.FC<
  AdditionalInformationProps
> = ({ formData, onInputChange }) => {
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

export default PatientAdditionalInformation;
