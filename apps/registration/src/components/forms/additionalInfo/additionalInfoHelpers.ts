import type { PersonAttributeField } from '../../../hooks/usePersonAttributeFields';
import type { AdditionalData } from '../../../models/patient';

export interface ConfigAttribute {
  field: string;
  translationKey: string;
}

export const getFieldsToShow = (
  attributeFields: PersonAttributeField[],
  configAttributes: ConfigAttribute[],
): PersonAttributeField[] => {
  if (configAttributes.length === 0) {
    return [];
  }

  const configFieldNames = configAttributes.map((attr) => attr.field);
  return attributeFields.filter((attrField) =>
    configFieldNames.includes(attrField.name),
  );
};

export const createFieldTranslationMap = (
  configAttributes: ConfigAttribute[],
): Record<string, string> => {
  const map: Record<string, string> = {};
  configAttributes.forEach((attr) => {
    map[attr.field] = attr.translationKey;
  });
  return map;
};

export const initializeFormData = (
  fieldsToShow: PersonAttributeField[],
  initialData?: AdditionalData,
): AdditionalData => {
  const data: AdditionalData = {};
  fieldsToShow.forEach((field) => {
    data[field.name] = initialData?.[field.name] ?? '';
  });
  return data;
};

export const getFieldLabel = (
  fieldName: string,
  fieldTranslationMap: Record<string, string>,
  translateFn: (key: string) => string,
): string => {
  const translationKey = fieldTranslationMap[fieldName] || fieldName;
  return translateFn(translationKey);
};
