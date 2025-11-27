import { Tile } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useCallback, useImperativeHandle, useState, useEffect, useMemo } from 'react';
import { usePersonAttributeFields } from '../../../hooks/usePersonAttributeFields';
import { useRegistrationConfig } from '../../../hooks/useRegistrationConfig';
import type { AdditionalData } from '../../../models/patient';

import { PersonAttributeInput } from '../../common/PersonAttributeInput';

import styles from '../additionalInfo/styles/index.module.scss';
import {
  getFieldsToShow,
  createFieldTranslationMap,
  initializeFormData,
  getFieldLabel,
} from './additionalInfoHelpers';
import {
  validateAllFields,
  getValidationConfig,
} from './additionalInfoValidation';

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

  const [formData, setFormData] = useState<AdditionalData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && expectedFields.length > 0) {
      const data: AdditionalData = {};
      expectedFields.forEach((field) => {
        data[field.field] = initialData[field.field] ?? '';
      });
      setFormData(data);
    }
  }, [initialData, expectedFields]);

  const handleFieldChange = useCallback(
    (fieldName: string, value: string | number | boolean) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));

      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: '' }));
      }
    },
    [errors],
  );

  const fieldValidationConfig = registrationConfig?.fieldValidation;

  const validate = useCallback((): boolean => {
    const result = validateAllFields(
      fieldsToShow,
      formData,
      fieldValidationConfig,
    );
    setErrors(result.errors);
    return result.isValid;
  }, [fieldsToShow, formData, fieldValidationConfig]);

  const getData = useCallback((): AdditionalData => {
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
    <div className={styles.additionalInfoSection}>
      <Tile className={styles.headerTile}>
        <span className={styles.headerTitle}>{t(sectionTitle)}</span>
      </Tile>
      <div className={styles.fieldsContainer}>
        <div className={styles.row}>
          {fieldsToShow.map((field) => {
            const fieldName = field.name;
            const value = formData[fieldName] ?? '';
            const error = errors[fieldName] || '';
            const label = getFieldLabel(fieldName, fieldTranslationMap, t);

            return (
              <div key={field.uuid} className={styles.attributeField}>
                <PersonAttributeInput
                  uuid={field.uuid}
                  label={label}
                  format={field.format}
                  value={value}
                  answers={field.answers}
                  error={error}
                  placeholder={label}
                  validation={getValidationConfig(
                    fieldName,
                    fieldValidationConfig,
                  )}
                  onChange={(newValue) =>
                    handleFieldChange(fieldName, newValue)
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

AdditionalInfo.displayName = 'AdditionalInfo';

export default AdditionalInfo;
