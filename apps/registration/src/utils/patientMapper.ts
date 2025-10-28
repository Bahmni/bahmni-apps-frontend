import type {
  CreatePatientRequest,
  PatientAttribute,
  PatientAddress,
} from '@bahmni-frontend/bahmni-services';
import type { PatientFormData } from '../models/patientForm';

export const mapFormDataToPatientRequest = (
  formData: PatientFormData,
  dobEstimated: boolean,
  primaryIdentifierType: string,
  identifierSources: Map<string, string> | undefined,
): CreatePatientRequest => {
  const addresses = buildAddresses(formData);
  const attributes = buildAttributes(formData);
  const identifierSourceUuid = identifierSources?.get(formData.patientIdFormat);

  return {
    patient: {
      person: {
        names: [
          {
            givenName: formData.firstName,
            ...(formData.middleName && { middleName: formData.middleName }),
            familyName: formData.lastName,
            display: `${formData.firstName}${formData.middleName ? ' ' + formData.middleName : ''} ${formData.lastName}`,
            preferred: false,
          },
        ],
        addresses,
        birthdate: formData.dateOfBirth,
        birthdateEstimated: dobEstimated,
        gender: formData.gender.charAt(0).toUpperCase(),
        birthtime: null,
        attributes,
        deathDate: null,
        causeOfDeath: '',
      },
      identifiers: [
        {
          ...(identifierSourceUuid && { identifierSourceUuid }),
          identifierPrefix: formData.patientIdFormat,
          identifierType: primaryIdentifierType,
          preferred: true,
          voided: false,
        },
      ],
    },
    relationships: [],
  };
};

const buildAddresses = (formData: PatientFormData): PatientAddress[] => {
  if (
    !formData.houseNumber &&
    !formData.locality &&
    !formData.city &&
    !formData.district &&
    !formData.state &&
    !formData.pincode
  ) {
    return [{}];
  }

  return [
    {
      ...(formData.houseNumber && { address1: formData.houseNumber }),
      ...(formData.locality && { address2: formData.locality }),
      ...(formData.city && { cityVillage: formData.city }),
      ...(formData.district && { countyDistrict: formData.district }),
      ...(formData.state && { stateProvince: formData.state }),
      ...(formData.pincode && { postalCode: formData.pincode }),
    },
  ];
};

const buildAttributes = (formData: PatientFormData): PatientAttribute[] => {
  const attributes: PatientAttribute[] = [];

  if (formData.phoneNumber) {
    attributes.push({
      attributeType: { uuid: 'phoneNumber-uuid' },
      value: formData.phoneNumber,
      voided: false,
    });
  }

  if (formData.altPhoneNumber) {
    attributes.push({
      attributeType: { uuid: 'alternatePhoneNumber-uuid' },
      value: formData.altPhoneNumber,
      voided: false,
    });
  }

  if (formData.email) {
    attributes.push({
      attributeType: { uuid: 'email-uuid' },
      value: formData.email,
      voided: false,
    });
  }

  return attributes;
};
