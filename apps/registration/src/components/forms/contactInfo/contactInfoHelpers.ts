import type { PersonAttributeField } from '../../../hooks/usePersonAttributeFields';
import type { ContactData } from '../../../models/patient';

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
  initialData?: ContactData,
): ContactData => {
  const data: ContactData = {
    phoneNumber: '',
    altPhoneNumber: '',
  };
  fieldsToShow.forEach((field) => {
    data[field.name as keyof ContactData] =
      (initialData?.[field.name as keyof ContactData] as string) ?? '';
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
