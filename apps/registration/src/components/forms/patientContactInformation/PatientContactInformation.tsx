import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import { useCallback, useImperativeHandle, useState } from 'react';
import type { ContactData } from '../../../models/patient';
import styles from './styles/index.module.scss';

export interface PatientContactInformationRef {
  validate: () => boolean;
  getData: () => ContactData;
}

interface PatientContactInformationProps {
  initialData?: ContactData;
  ref?: React.Ref<PatientContactInformationRef>;
}

export const PatientContactInformation = ({
  initialData,
  ref,
}: PatientContactInformationProps) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<ContactData>({
    phoneNumber: initialData?.phoneNumber ?? '',
    altPhoneNumber: initialData?.altPhoneNumber ?? '',
  });

  const handlePhoneChange = useCallback(
    (field: keyof ContactData, value: string) => {
      const numericRegex = /^\+?[0-9]*$/;
      if (numericRegex.test(value)) {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    },
    [],
  );

  const validate = useCallback((): boolean => {
    return true;
  }, []);

  const getData = useCallback((): ContactData => {
    return formData;
  }, [formData]);

  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

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

PatientContactInformation.displayName = 'PatientContactInformation';

export default PatientContactInformation;
