import { PatientAttribute, AttributeType } from '../types/registration';

const setAttributeValue = (
  attributeType: AttributeType,
  attr: any,
  value: any,
) => {
  if (value === '' || value === null || value === undefined) {
    attr.voided = true;
  } else if (attributeType.datatype === 'org.openmrs.Concept') {
    attr.value = value.conceptUuid;
    attr.hydratedObject = value.conceptUuid;
  } else if (
    attributeType.datatype === 'org.openmrs.util.AttributableDate' ||
    attributeType.datatype ===
      'org.openmrs.customdatatype.datatype.DateDatatype'
  ) {
    attr.value = new Date(value).toISOString().slice(0, 10);
  } else {
    attr.value = value.toString();
  }
};

export const getMrsAttributes = (
  model: any,
  attributeTypes: AttributeType[],
): any[] => {
  return attributeTypes.map((result) => {
    const attribute: any = {
      attributeType: {
        uuid: result.uuid,
      },
    };
    if (model) {
      setAttributeValue(result, attribute, model[result.name]);
    }
    return attribute;
  });
};
