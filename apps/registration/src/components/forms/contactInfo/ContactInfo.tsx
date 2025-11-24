import { TextInput } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useCallback, useImperativeHandle, useState, useMemo } from 'react';
import { usePersonAttributeFields } from '../../../hooks/usePersonAttributeFields';
import { useRegistrationConfig } from '../../../hooks/useRegistrationConfig';
import type { ContactData } from '../../../models/patient';
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

  // Filter by name: Only show fields that exist in BOTH person attributes API AND config attributes
  const fieldsToShow = useMemo(() => {
    if (configAttributes.length === 0) {
      return [];
    }

    const configFieldNames = configAttributes.map((attr) => attr.field);
    return attributeFields.filter((attrField) =>
      configFieldNames.includes(attrField.name),
    );
  }, [configAttributes, attributeFields]);

  // Create a map of field name to translation key
  const fieldTranslationMap = useMemo(() => {
    const map: Record<string, string> = {};
    configAttributes.forEach((attr) => {
      map[attr.field] = attr.translationKey;
    });
    return map;
  }, [configAttributes]);

  // Initialize form data based on fields to show
  const initialFormData = useMemo(() => {
    const data: ContactData = {
      phoneNumber: '',
      altPhoneNumber: '',
    };
    fieldsToShow.forEach((field) => {
      data[field.name as keyof ContactData] =
        (initialData?.[field.name as keyof ContactData] as string) ?? '';
    });
    return data;
  }, [fieldsToShow, initialData]);

  const [formData, setFormData] = useState<ContactData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhoneChange = useCallback(
    (fieldName: string, value: string) => {
      const numericRegex = /^\+?[0-9]*$/;
      if (numericRegex.test(value)) {
        setFormData((prev) => ({ ...prev, [fieldName]: value }));

        // Clear error when user types
        if (errors[fieldName]) {
          setErrors((prev) => ({ ...prev, [fieldName]: '' }));
        }
      }
    },
    [errors],
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fieldsToShow.forEach((field) => {
      const fieldName = field.name;
      const value = formData[fieldName as keyof ContactData] as string;
      const validationRule = fieldValidationConfig?.[fieldName];

      if (validationRule && value) {
        const regex = new RegExp(validationRule.pattern);
        if (!regex.test(value)) {
          newErrors[fieldName] = validationRule.errorMessage;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [fieldsToShow, formData, fieldValidationConfig]);

  const getData = useCallback((): ContactData => {
    return formData;
  }, [formData]);

  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  // If no fields match between config and API, don't render the section
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
          const translationKey = fieldTranslationMap[fieldName] || fieldName;
          const label = t(translationKey);
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
