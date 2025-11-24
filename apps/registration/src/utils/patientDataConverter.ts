import type { FormattedPatientData } from '@bahmni/services';
import { AddressData } from '../hooks/useAddressFields';
import type {
  BasicInfoData,
  ContactData,
  AdditionalData,
} from '../models/patient';

/**
 * Convert FormattedPatientData to BasicInfoData (Profile component)
 * Extracts name parts from fullName and age components
 */
export const convertToBasicInfoData = (
  patientData: FormattedPatientData | undefined,
): BasicInfoData | undefined => {
  if (!patientData) return undefined;

  const nameParts = patientData.fullName?.split(' ') ?? [];
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const middleName =
    nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

  const ageYears = patientData.age?.years?.toString() ?? '';
  const ageMonths = patientData.age?.months?.toString() ?? '';
  const ageDays = patientData.age?.days?.toString() ?? '';

  return {
    patientIdFormat: '',
    entryType: false,
    firstName,
    middleName,
    lastName,
    gender: patientData.gender ?? '',
    ageYears,
    ageMonths,
    ageDays,
    dateOfBirth: patientData.birthDate ?? '',
    birthTime: '',
  };
};

/**
 * Convert FormattedPatientData to ContactData (ContactInfo component)
 * Extracts phone number from formattedContact string
 */
export const convertToContactData = (
  patientData: FormattedPatientData | undefined,
): ContactData | undefined => {
  if (!patientData?.formattedContact) return undefined;

  const phoneMatch = patientData.formattedContact.match(/phone:\s*(.+)/i);
  const phoneNumber = phoneMatch?.[1]?.trim() ?? '';

  return {
    phoneNumber,
    altPhoneNumber: '',
  };
};

/**
 * Convert FormattedPatientData to AddressData (AddressInfo component)
 * Parses formattedAddress string into address components
 * Returns Record<string, string | null> format for hook compatibility
 */
export const convertToAddressData = (
  patientData: FormattedPatientData | undefined,
): AddressData | undefined => {
  if (!patientData?.formattedAddress) return undefined;

  const parts = patientData.formattedAddress.split(',').map((p) => p.trim());

  return {
    address1: parts[0] || null,
    address2: parts[1] || null,
    cityVillage: parts[2] || null,
    countyDistrict: null,
    stateProvince: parts[3]?.split(' ')[0] || null,
    postalCode: parts[3]?.split(' ')[1] || null,
  };
};

/**
 * Convert FormattedPatientData to AdditionalData (AdditionalInfo component)
 * Extracts additional attributes from identifiers map
 */
export const convertToAdditionalData = (
  patientData: FormattedPatientData | undefined,
): AdditionalData | undefined => {
  if (!patientData) return undefined;

  const additionalData: AdditionalData = {};

  if (patientData.identifiers && patientData.identifiers.size > 0) {
    patientData.identifiers.forEach((value, key) => {
      if (key.toLowerCase().includes('email')) {
        additionalData.email = value;
      } else {
        additionalData[key] = value;
      }
    });
  }

  return Object.keys(additionalData).length > 0 ? additionalData : undefined;
};
