import { Tile } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import {
  useCallback,
  useImperativeHandle,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { usePersonAttributeFields } from '../../../hooks/usePersonAttributeFields';
import { useRegistrationConfig } from '../../../hooks/useRegistrationConfig';
import type { PersonAttributesData } from '../../../models/patient';

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
import styles from '../additionalInfo/styles/index.module.scss';

export interface AdditionalInfoRef {
  validate: () => boolean;
  getData: () => PersonAttributesData;
}

interface AdditionalInfoProps {
  initialData?: PersonAttributesData;
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

  const fieldValidationConfig = registrationConfig?.fieldValidation;

  const validate = useCallback((): boolean => {
    const result = validateAllFields(
      fieldsToShow,
      formData,
      fieldValidationConfig,
      t,
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

  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  if (fieldsToShow.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.additionalInfoSection}
      data-testid="additional-info-section"
    >
      <Tile className={styles.headerTile} data-testid="additional-info-header">
        <span className={styles.headerTitle}>{t(sectionTitle)}</span>
      </Tile>
      <div
        className={styles.fieldsContainer}
        data-testid="additional-info-fields-container"
      >
        <div className={styles.row}>
          {fieldsToShow.map((field) => {
            const fieldName = field.name;
            const value = formData[fieldName] ?? '';
            const error = errors[fieldName] || '';
            const label = getFieldLabel(fieldName, fieldTranslationMap, t);

            return (
              <div
                key={field.uuid}
                className={styles.attributeField}
                data-testid="additional-info-attribute-field"
              >
                <PersonAttributeInput
                  uuid={field.uuid}
                  name={fieldName}
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
