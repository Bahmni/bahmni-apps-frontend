import type { PatientProfileResponse } from '@bahmni/services';
import { calculateAge } from '@bahmni/services';
import { format, isValid, parseISO } from 'date-fns';
import { AddressData } from '../hooks/useAddressFields';
import type {
  BasicInfoData,
  ContactData,
  AdditionalData,
} from '../models/patient';

export const convertToBasicInfoData = (
  patientData: PatientProfileResponse | undefined,
  getGenderDisplay?: (code: string) => string,
): BasicInfoData | undefined => {
  if (!patientData) return undefined;

  const preferredName =
    patientData.patient.person.names.find((name) => name.preferred) ??
    patientData.patient.person.names[0];

  if (!preferredName) return undefined;

  const birthdate = patientData.patient.person.birthdate;
  const birthtimeIso = patientData.patient.person.birthtime;

  const dateOnly = birthdate ? birthdate.split('T')[0] : '';

  const age = dateOnly ? calculateAge(dateOnly) : null;

  let birthTime = '';
  if (birthtimeIso) {
    const date = parseISO(birthtimeIso);
    if (isValid(date)) {
      birthTime = format(date, 'HH:mm');
    }
  }
  const genderCode = patientData.patient.person.gender;
  const genderDisplay = getGenderDisplay?.(genderCode) ?? genderCode;

  return {
    patientIdFormat: '',
    entryType: patientData.patient.person.birthdateEstimated,
    firstName: preferredName.givenName,
    middleName: preferredName.middleName ?? '',
    lastName: preferredName.familyName,
    gender: genderDisplay,
    ageYears: age?.years.toString() ?? '',
    ageMonths: age?.months.toString() ?? '',
    ageDays: age?.days.toString() ?? '',
    dateOfBirth: dateOnly,
    birthTime: birthTime,
    nameUuid: preferredName.uuid,
  };
};

export const convertToContactData = (
  patientData: PatientProfileResponse | undefined,
): ContactData | undefined => {
  if (!patientData?.patient.person.attributes) {
    return undefined;
  }

  return convertPersonAttributes(patientData);
};

export const convertToAddressData = (
  patientData: PatientProfileResponse | undefined,
): AddressData | undefined => {
  if (
    !patientData?.patient.person.addresses ||
    patientData.patient.person.addresses.length === 0
  ) {
    return undefined;
  }

  const address = patientData.patient.person.addresses[0];

  const addressData: AddressData = {};
  Object.keys(address).forEach((key) => {
    if (key === 'links' || key === 'resourceVersion') return;

    const value = (address as Record<string, unknown>)[key];
    addressData[key] =
      value !== undefined && value !== null ? String(value) : null;
  });

  return addressData;
};

export const convertToAdditionalData = (
  patientData: PatientProfileResponse | undefined,
): AdditionalData | undefined => {
  if (
    !patientData?.patient.person.attributes ||
    patientData.patient.person.attributes.length === 0
  ) {
    return undefined;
  }

  return convertPersonAttributes(patientData);
};

function convertPersonAttributes(
  patientData: PatientProfileResponse,
): Record<string, string> {
  const data: Record<string, string> = {};

  patientData.patient.person.attributes?.forEach((attr) => {
    const fieldName = attr.attributeType?.display;
    if (!fieldName) return;
    data[fieldName] = attr.value?.toString() ?? '';
  });

  return data;
}

export const convertToAdditionalIdentifiersData = (
  patientData: PatientProfileResponse | undefined,
): Record<string, string> | undefined => {
  if (
    !patientData?.patient.identifiers ||
    patientData.patient.identifiers.length <= 1
  ) {
    return undefined;
  }

  const additionalIdentifiers = patientData.patient.identifiers.slice(1);

  const identifiersData: Record<string, string> = {};

  additionalIdentifiers.forEach((identifier) => {
    if (!identifier.voided && identifier.identifierType?.uuid) {
      identifiersData[identifier.identifierType.uuid] =
        identifier.identifier ?? '';
    }
  });

  return Object.keys(identifiersData).length > 0 ? identifiersData : undefined;
};
