import type { PatientProfileResponse } from '@bahmni/services';
import { calculateAge } from '@bahmni/services';
import { format, isValid, parseISO } from 'date-fns';
import type { RelationshipData } from '../components/forms/patientRelationships/PatientRelationships';
import { AddressData } from '../hooks/useAddressFields';
import type { BasicInfoData, PersonAttributesData } from '../models/patient';

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

export const convertToPersonAttributesData = (
  patientData: PatientProfileResponse | undefined,
): PersonAttributesData | undefined => {
  if (
    !patientData?.patient.person.attributes ||
    patientData.patient.person.attributes.length === 0
  ) {
    return undefined;
  }

  const data: PersonAttributesData = {};

  patientData.patient.person.attributes.forEach((attr) => {
    const fieldName = attr.attributeType?.display;
    if (!fieldName) return;
    data[fieldName] = attr.value?.toString() ?? '';
  });

  return data;
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

export const convertToRelationshipsData = (
  patientData: PatientProfileResponse | undefined,
): RelationshipData[] => {
  if (!patientData?.relationships || patientData.relationships.length === 0) {
    return [];
  }

  const currentPatientUuid = patientData.patient.uuid;

  return patientData.relationships
    .filter((rel) => !rel.voided)
    .map((rel) => {
      const isPersonA = rel.personA.uuid === currentPatientUuid;
      const relatedPerson = isPersonA ? rel.personB : rel.personA;

      let formattedDate = '';
      if (rel.endDate) {
        const date = parseISO(rel.endDate);
        if (isValid(date)) {
          formattedDate = format(date, 'yyyy-MM-dd');
        }
      }

      return {
        id: rel.uuid,
        relationshipType: rel.relationshipType.uuid,
        relationshipTypeLabel: isPersonA
          ? rel.relationshipType.display.split('/')[0]?.trim()
          : rel.relationshipType.display.split('/')[1]?.trim(),
        patientId: '',
        patientUuid: relatedPerson.uuid,
        patientName: relatedPerson.display,
        tillDate: formattedDate,
        isExisting: true,
      };
    });
};
