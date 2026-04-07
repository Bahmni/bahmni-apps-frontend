import { useTranslation } from '@bahmni/services';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  useMemo,
} from 'react';

import { usePersonAttributeFields } from '../../../hooks/usePersonAttributeFields';
import type { PersonAttributesData } from '../../../models/patient';
import { useRegistrationConfig } from '../../../providers/registrationConfig';

import {
  getFieldsToShow,
  createFieldTranslationMap,
  getFieldLabel,
} from '../../common/personAttributeHelpers';
import { PersonAttributeInput } from '../../common/PersonAttributeInput';
import {
  validateAllFields,
  getValidationConfig,
} from '../../common/personAttributeValidation';
import styles from './styles/index.module.scss';

export interface ContactInfoRef {
  validate: () => boolean;
  getData: () => PersonAttributesData;
}

interface ContactInfoProps {
  initialData?: PersonAttributesData;
  ref?: React.Ref<ContactInfoRef>;
}

export const ContactInfo = ({ initialData, ref }: ContactInfoProps) => {
  const { t } = useTranslation();
  const { attributeFields } = usePersonAttributeFields();
  const { registrationConfig } = useRegistrationConfig();

  const contactInfoConfig =
    registrationConfig?.patientInformation?.contactInformation;
  const configAttributes = contactInfoConfig?.attributes ?? [];
  const fieldValidationConfig = registrationConfig?.fieldValidation;

  const fieldsToShow = useMemo(
    () => getFieldsToShow(attributeFields, configAttributes),
    [configAttributes, attributeFields],
  );

  const fieldTranslationMap = useMemo(
    () => createFieldTranslationMap(configAttributes),
    [configAttributes],
  );

  const [formData, setFormData] = useState<PersonAttributesData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData, fieldsToShow]);

  const handleFieldChange = useCallback(
    (fieldName: string, value: string | number | boolean) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));

      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: '' }));
      }
    },
    [errors],
  );

  const validate = useCallback((): boolean => {
    const result = validateAllFields(
      fieldsToShow,
      formData,
      t,
      fieldValidationConfig,
    );
    setErrors(result.errors);
    return result.isValid;
  }, [fieldsToShow, formData, fieldValidationConfig, t]);

  const getData = useCallback((): PersonAttributesData => {
    const displayedData: PersonAttributesData = {};
    fieldsToShow.forEach((field) => {
      if (formData[field.name] !== undefined) {
        displayedData[field.name] = formData[field.name];
      }
    });
    return displayedData;
  }, [formData, fieldsToShow]);

  const getLabel = (labelKey: string, isRequired: boolean) => {
    return (
      <>
        {t(labelKey)}
        {isRequired && <span className={styles.requiredAsterisk}>*</span>}
      </>
    );
  };

  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  if (fieldsToShow.length === 0) {
    return null;
  }

  return (
    <div className={styles.formSection} data-testid="patient-contact">
      <div className={styles.row} data-testid="contact-info-fields-row">
        {fieldsToShow.map((field) => {
          const fieldName = field.name;
          const value = formData[fieldName] ?? '';
          const translatedLabel = getFieldLabel(
            fieldName,
            fieldTranslationMap,
            t,
          );
          const isRequired = field.required ?? false;
          const label = getLabel(translatedLabel, isRequired);
          const error = errors[fieldName] || '';

          return (
            <div
              key={field.uuid}
              className={styles.phoneNumberField}
              data-testid="contact-info-field"
            >
              <PersonAttributeInput
                uuid={field.uuid}
                name={fieldName}
                label={label}
                format={field.format}
                value={value}
                answers={field.answers}
                error={error}
                placeholder={translatedLabel}
                validation={getValidationConfig(
                  fieldName,
                  fieldValidationConfig,
                )}
                onChange={(newValue) => handleFieldChange(fieldName, newValue)}
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
