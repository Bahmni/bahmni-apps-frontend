import type { PersonAttributeField } from '../../hooks/usePersonAttributeFields';
import type { PersonAttributesData } from '../../models/patient';

export interface ConfigAttribute {
  field: string;
  translationKey: string;
  required?: boolean;
}

export const getFieldsToShow = (
  attributeFields: PersonAttributeField[],
  configAttributes: ConfigAttribute[],
): PersonAttributeField[] => {
  if (configAttributes.length === 0) {
    return [];
  }

  return configAttributes
    .map((configAttr) => {
      const attrField = attributeFields.find(
        (field) => field.name === configAttr.field,
      );
      if (!attrField) return undefined;

      return {
        ...attrField,
        required: configAttr.required,
      } as PersonAttributeField;
    })
    .filter((field): field is PersonAttributeField => field !== undefined);
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
  initialData?: PersonAttributesData,
): PersonAttributesData => {
  const data: PersonAttributesData = {};
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
