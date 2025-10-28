import {
  notificationService,
  type CreatePatientRequest,
  type PatientAttribute,
  PatientAddress,
} from '@bahmni-frontend/bahmni-services';
import {
  ALTERNATE_PHONE_NUMBER_UUID,
  EMAIL_UUID,
  PHONE_NUMBER_UUID,
} from '@bahmni-frontend/bahmni-services';
import type { UseMutationResult } from '@tanstack/react-query';

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  district: string;
  state: string;
  pincode: string;
  houseNumber: string;
  locality: string;
  city: string;
  phoneNumber: string;
  altPhoneNumber: string;
  email: string;
  patientIdFormat: string;
}

interface AddressErrors {
  district: string;
  state: string;
  pincode: string;
}

interface AddressSelectedFromDropdown {
  district: boolean;
  state: boolean;
  pincode: boolean;
}

interface CreatePatientSaveHandlerParams {
  formData: FormData;
  t: (key: string) => string;
  setAddressErrors: React.Dispatch<React.SetStateAction<AddressErrors>>;
  addressSelectedFromDropdown: AddressSelectedFromDropdown;
  primaryIdentifierType: string | undefined;
  identifierSources: Map<string, string> | undefined;
  dobEstimated: boolean;
  createPatientMutation: UseMutationResult<
    unknown,
    Error,
    CreatePatientRequest,
    unknown
  >;
  validateBasicInfo: () => boolean;
}

export const createPatientSaveHandler = ({
  formData,
  t,
  setAddressErrors,
  addressSelectedFromDropdown,
  primaryIdentifierType,
  identifierSources,
  dobEstimated,
  createPatientMutation,
  validateBasicInfo,
}: CreatePatientSaveHandlerParams) => {
  return () => {
    // Validate basic information fields (shows inline errors)
    const isBasicInfoValid = validateBasicInfo();

    let hasErrors = false;
    const addrErrors: AddressErrors = {
      district: '',
      state: '',
      pincode: '',
    };

    // Validate address fields - if they have a value, it must be from dropdown
    if (formData.district && !addressSelectedFromDropdown.district) {
      addrErrors.district = t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN');
      hasErrors = true;
    }
    if (formData.state && !addressSelectedFromDropdown.state) {
      addrErrors.state = t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN');
      hasErrors = true;
    }
    if (formData.pincode && !addressSelectedFromDropdown.pincode) {
      addrErrors.pincode = t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN');
      hasErrors = true;
    }

    setAddressErrors(addrErrors);

    // Return if there are any validation errors
    if (!isBasicInfoValid || hasErrors) return;

    if (!primaryIdentifierType) {
      notificationService.showError(
        'Error',
        'Unable to determine identifier type',
        5000,
      );
      return;
    }

    // Build addresses array
    const addresses: PatientAddress[] = [];
    if (
      formData.houseNumber ||
      formData.locality ||
      formData.city ||
      formData.district ||
      formData.state ||
      formData.pincode
    ) {
      addresses.push({
        ...(formData.houseNumber && { address1: formData.houseNumber }),
        ...(formData.locality && { address2: formData.locality }),
        ...(formData.city && { cityVillage: formData.city }),
        ...(formData.district && { countyDistrict: formData.district }),
        ...(formData.state && { stateProvince: formData.state }),
        ...(formData.pincode && { postalCode: formData.pincode }),
      });
    } else {
      addresses.push({});
    }

    // Build attributes array
    const attributes: PatientAttribute[] = [];
    if (formData.phoneNumber) {
      attributes.push({
        attributeType: { uuid: PHONE_NUMBER_UUID },
        value: formData.phoneNumber,
        voided: false,
      });
    }
    if (formData.altPhoneNumber) {
      attributes.push({
        attributeType: { uuid: ALTERNATE_PHONE_NUMBER_UUID },
        value: formData.altPhoneNumber,
        voided: false,
      });
    }
    if (formData.email) {
      attributes.push({
        attributeType: { uuid: EMAIL_UUID },
        value: formData.email,
        voided: false,
      });
    }

    const identifierSourceUuid = identifierSources?.get(
      formData.patientIdFormat,
    );

    // Build patient request
    const patientRequest: CreatePatientRequest = {
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

    createPatientMutation.mutate(patientRequest);
  };
};
