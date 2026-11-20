import type { Address, ContactPoint, Identifier, Patient } from 'fhir/r4';
import { EMAIL_EXT_URL, PHONE_NUMBER_EXT_URL } from '../constants/app';
import { convertFhirToAddressData } from './fhirPatientToFormData';

export const withSavedIdentifiers = (
  payload: Patient,
  saved?: Identifier[],
): Patient =>
  saved?.length
    ? { ...payload, identifier: [...saved, ...(payload.identifier ?? [])] }
    : payload;

const CONTACT_EXTENSIONS = [
  { system: 'phone', url: PHONE_NUMBER_EXT_URL },
  { system: 'email', url: EMAIL_EXT_URL },
] as const;

const buildTelecom = (patient: Patient): ContactPoint[] | undefined => {
  const existing = patient.telecom ?? [];
  const fromExtensions = CONTACT_EXTENSIONS.flatMap(({ system, url }) => {
    if (existing.some((contact) => contact.system === system)) return [];
    const value = patient.extension
      ?.find((extension) => extension.url === url)
      ?.valueString?.trim();
    return value ? [{ system, value }] : [];
  });
  const telecom = [...existing, ...fromExtensions];
  return telecom.length > 0 ? telecom : undefined;
};

const toAddressView = (address: Address): Address => {
  const addressData = convertFhirToAddressData({
    resourceType: 'Patient',
    address: [address],
  });
  const { city, district, state, postalCode, country } = address;
  return {
    line:
      address.line ??
      [addressData?.address1, addressData?.address2].filter(
        (line): line is string => !!line,
      ),
    city,
    district,
    state,
    postalCode,
    country,
  };
};

export const toDuplicatePatientView = (patient: Patient): Patient => ({
  resourceType: 'Patient',
  id: patient.id,
  photo: patient.photo,
  name: patient.name,
  identifier: patient.identifier,
  address: patient.address?.map(toAddressView),
  gender: patient.gender,
  birthDate: patient.birthDate,
  telecom: buildTelecom(patient),
});
