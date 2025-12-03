import { TextInput } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  useMemo,
} from 'react';

import { usePersonAttributeFields } from '../../../hooks/usePersonAttributeFields';
import { useRegistrationConfig } from '../../../hooks/useRegistrationConfig';
import type { ContactData } from '../../../models/patient';

import {
  getFieldsToShow,
  createFieldTranslationMap,
  initializeFormData,
  getFieldLabel,
} from './contactInfoHelpers';
import {
  isNumericPhoneValue,
  validateAllFields,
} from './contactInfoValidation';
import styles from './styles/index.module.scss';

export interface ContactInfoRef {
  validate: () => boolean;
  getData: () => ContactData;
}

interface ContactInfoProps {
  initialData?: ContactData;
  ref?: React.Ref<ContactInfoRef>;
}

export const ContactInfo = ({ initialData, ref }: ContactInfoProps) => {
  const { t } = useTranslation();
  const { attributeFields } = usePersonAttributeFields();
  const { registrationConfig } = useRegistrationConfig();

  const contactInfoConfig =
    registrationConfig?.patientInformation?.contactInformation;
  const configAttributes = contactInfoConfig?.attributes ?? [];
  const sectionTitle =
    contactInfoConfig?.translationKey ?? 'CREATE_PATIENT_SECTION_CONTACT_INFO';

  const fieldValidationConfig = registrationConfig?.fieldValidation;

  const fieldsToShow = useMemo(
    () => getFieldsToShow(attributeFields, configAttributes),
    [configAttributes, attributeFields],
  );

  const fieldTranslationMap = useMemo(
    () => createFieldTranslationMap(configAttributes),
    [configAttributes],
  );

  const initialFormData = useMemo(
    () => initializeFormData(fieldsToShow, initialData),
    [fieldsToShow, initialData],
  );

  const [formData, setFormData] = useState<ContactData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        phoneNumber: initialData.phoneNumber ?? '',
        altPhoneNumber: initialData.altPhoneNumber ?? '',
      });
    }
  }, [initialData]);
  const handlePhoneChange = useCallback(
    (fieldName: string, value: string) => {
      if (isNumericPhoneValue(value)) {
        setFormData((prev) => ({ ...prev, [fieldName]: value }));

        if (errors[fieldName]) {
          setErrors((prev) => ({ ...prev, [fieldName]: '' }));
        }
      }
    },
    [errors],
  );

  const validate = useCallback((): boolean => {
    const result = validateAllFields(
      fieldsToShow,
      formData,
      fieldValidationConfig,
    );
    setErrors(result.errors);
    return result.isValid;
  }, [fieldsToShow, formData, fieldValidationConfig]);

  const getData = useCallback((): ContactData => {
    return formData;
  }, [formData]);

  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  if (fieldsToShow.length === 0) {
    return null;
  }

  return (
    <div className={styles.formSection}>
      <span className={styles.formSectionTitle}>{t(sectionTitle)}</span>
      <div className={styles.row}>
        {fieldsToShow.map((field) => {
          const fieldName = field.name;
          const value =
            (formData[fieldName as keyof ContactData] as string) ?? '';
          const label = getFieldLabel(fieldName, fieldTranslationMap, t);
          const error = errors[fieldName] || '';

          return (
            <div key={field.uuid} className={styles.phoneNumberField}>
              <TextInput
                id={field.uuid}
                labelText={label}
                placeholder={label}
                value={value}
                invalid={!!error}
                invalidText={error}
                onChange={(e) => handlePhoneChange(fieldName, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

ContactInfo.displayName = 'ContactInfo';

export default ContactInfo;
