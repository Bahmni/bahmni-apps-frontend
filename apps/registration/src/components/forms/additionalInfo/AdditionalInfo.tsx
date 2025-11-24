import { TextInput, Tile } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useCallback, useImperativeHandle, useState, useMemo } from 'react';
import { usePersonAttributeFields } from '../../../hooks/usePersonAttributeFields';
import { useRegistrationConfig } from '../../../hooks/useRegistrationConfig';
import type { AdditionalData } from '../../../models/patient';
import styles from '../additionalInfo/styles/index.module.scss';

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
  const { attributeFields } = usePersonAttributeFields();

  const additionalInfoConfig =
    registrationConfig?.patientInformation?.additionalPatientInformation;
  const configAttributes = additionalInfoConfig?.attributes ?? [];
  const sectionTitle =
    additionalInfoConfig?.translationKey ??
    'CREATE_PATIENT_SECTION_ADDITIONAL_INFO';

  // Only show fields that exist in BOTH person attributes API AND config attributes
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
    const data: AdditionalData = {};
    fieldsToShow.forEach((field) => {
      data[field.name] = initialData?.[field.name] ?? '';
    });
    return data;
  }, [fieldsToShow, initialData]);

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

  const fieldValidationConfig = registrationConfig?.fieldValidation;

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fieldsToShow.forEach((field) => {
      const fieldName = field.name;
      const value = formData[fieldName];
      const validationRule = fieldValidationConfig?.[fieldName];

      if (validationRule && value) {
        const regex = new RegExp(validationRule.pattern);
        if (!regex.test(value as string)) {
          newErrors[fieldName] = validationRule.errorMessage;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [fieldsToShow, formData, fieldValidationConfig]);

  const getData = useCallback((): AdditionalData => {
    return formData;
  }, [formData]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  // If no fields match between config and API, don't render the section
  if (fieldsToShow.length === 0) {
    return null;
  }

  return (
    <div className={styles.additionalInfoSection}>
      <Tile className={styles.headerTile}>
        <span className={styles.headerTitle}>{t(sectionTitle)}</span>
      </Tile>
      <div className={styles.row}>
        {fieldsToShow.map((field) => {
          const fieldName = field.name;
          const value = formData[fieldName] ?? '';
          const error = errors[fieldName] || '';
          const translationKey = fieldTranslationMap[fieldName] || fieldName;
          const label = t(translationKey);
          return (
            <div key={field.uuid} className={styles.emailField}>
              <TextInput
                id={field.uuid}
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
