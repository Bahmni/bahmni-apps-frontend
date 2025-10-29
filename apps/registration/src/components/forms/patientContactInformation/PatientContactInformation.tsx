import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import styles from '../../../pages/createPatientPage/styles/index.module.scss';

export interface ContactData {
  phoneNumber: string;
  altPhoneNumber: string;
}

interface ContactInformationProps {
  formData: ContactData;
  onInputChange: (field: string, value: string) => void;
}

export const PatientContactInformation: React.FC<ContactInformationProps> = ({
  formData,
  onInputChange,
}) => {
  const { t } = useTranslation();

  // Handle phone change with numeric validation
  const handlePhoneChange = (field: string, value: string) => {
    const numericRegex = /^\+?[0-9]*$/;
    if (numericRegex.test(value)) {
      onInputChange(field, value);
    }
  };

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
            onChange={(e) => handlePhoneChange('phoneNumber', e.target.value)}
          />
        </div>
        <div className={styles.phoneNumberField}>
          <TextInput
            id="alt-phone-number"
            labelText={t('CREATE_PATIENT_ALT_PHONE_NUMBER')}
            placeholder={t('CREATE_PATIENT_ALT_PHONE_NUMBER')}
            value={formData.altPhoneNumber}
            onChange={(e) =>
              handlePhoneChange('altPhoneNumber', e.target.value)
            }
          />
        </div>
      </div>
    </div>
  );
};

export default PatientContactInformation;
