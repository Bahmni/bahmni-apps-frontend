import {
  PatientAddress,
  PatientIdentifier,
  PersonAttributeType,
} from '@bahmni/services';
import type { Patient, Extension, Identifier, Address } from 'fhir/r4';
import {
  BasicInfoData,
  PersonAttributesData,
  AdditionalIdentifiersData,
} from '../models/patient';
import { convertTimeToISODateTime } from './dateTimeUtils';

const PATIENT_ATTRIBUTE_EXT_PREFIX = 'http://fhir.bahmni.org/ext/patient/'; // NOSONAR
const IDENTIFIER_LOCATION_EXT_URL =
  'http://fhir.openmrs.org/ext/patient/identifier#location'; // NOSONAR

function buildLocationExtension(
  locationUuid?: string,
): Extension[] | undefined {
  if (!locationUuid) return undefined;
  return [
    {
      url: IDENTIFIER_LOCATION_EXT_URL,
      valueReference: { reference: `Location/${locationUuid}` },
    },
  ];
}

function toSlugCase(str: string): string {
  return str
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();
}

function mapGender(gender: string): 'male' | 'female' | 'other' | 'unknown' {
  const char = (gender ?? '').charAt(0).toUpperCase();
  if (char === 'M') return 'male';
  if (char === 'F') return 'female';
  if (char === 'O') return 'other';
  return 'unknown';
}

function buildBirthDate(
  dateOfBirth: string,
  estimated: boolean,
): string | undefined {
  if (!dateOfBirth) return undefined;
  if (estimated) return dateOfBirth.substring(0, 7); // YYYY-MM
  return dateOfBirth; // YYYY-MM-DD
}

interface MapperInput {
  profile: BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
  };
  address: PatientAddress;
  contact: PersonAttributesData;
  additional: PersonAttributesData;
  additionalIdentifiers: AdditionalIdentifiersData;
  additionalIdentifiersInitialData?: AdditionalIdentifiersData;
  identifierTypeNames?: Record<string, string>;
  loginLocationUuid?: string;
  personAttributes: PersonAttributeType[];
  patientUuid?: string;
}

export function buildFhirPatient(input: MapperInput): Patient {
  const {
    profile,
    address,
    contact,
    additional,
    additionalIdentifiers,
    additionalIdentifiersInitialData,
    identifierTypeNames,
    loginLocationUuid,
    personAttributes,
    patientUuid,
  } = input;

  // Identifiers
  const identifiers: Identifier[] = [];
  const locationExt = buildLocationExtension(loginLocationUuid);
  if (profile.patientIdentifier?.identifier) {
    identifiers.push({
      use: 'official',
      value: String(profile.patientIdentifier.identifier),
      type: {
        coding: [
          { code: String(profile.patientIdentifier.identifierType ?? '') },
        ],
        ...(profile.patientIdentifier.identifierTypeName && {
          text: profile.patientIdentifier.identifierTypeName,
        }),
      },
      ...(locationExt && { extension: locationExt }),
    });
  }
  Object.entries(additionalIdentifiers).forEach(([typeUuid, value]) => {
    const hasInitialData = additionalIdentifiersInitialData?.[typeUuid]?.trim();
    if (hasInitialData) return;

    const trimmedValue = value?.trim();
    if (trimmedValue) {
      identifiers.push({
        value: trimmedValue,
        type: {
          coding: [{ code: typeUuid }],
          ...(identifierTypeNames?.[typeUuid] && {
            text: identifierTypeNames[typeUuid],
          }),
        },
        ...(locationExt && { extension: locationExt }),
      });
    }
  });

  // Name
  const given: string[] = [];
  if (profile.firstName?.trim()) given.push(profile.firstName.trim());
  if (profile.middleName?.trim()) given.push(profile.middleName.trim());

  // Extensions — person attributes
  const extensions: Extension[] = [];
  const allAttributes: PersonAttributesData = { ...contact, ...additional };

  personAttributes.forEach((attrType) => {
    if (!Object.prototype.hasOwnProperty.call(allAttributes, attrType.name)) {
      return;
    }

    const value = allAttributes[attrType.name];
    const slug = toSlugCase(attrType.name);
    const url = PATIENT_ATTRIBUTE_EXT_PREFIX + slug;

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      if (typeof value === 'boolean') {
        extensions.push({ url, valueBoolean: value });
      } else {
        extensions.push({ url, valueString: String(value) });
      }
    } else if (patientUuid) {
      extensions.push({ url });
    }
  });

  // Address
  const fhirAddresses: Address[] = [];
  if (address) {
    const addr: Address = { use: 'home' };
    let hasValue = false;

    const addressExtFields: Extension[] = [];
    if (address.address1?.trim()) {
      addressExtFields.push({
        url: 'http://fhir.openmrs.org/ext/address#address1', // NOSONAR
        valueString: address.address1.trim(),
      });
      hasValue = true;
    }
    if (address.address2?.trim()) {
      addressExtFields.push({
        url: 'http://fhir.openmrs.org/ext/address#address2', // NOSONAR
        valueString: address.address2.trim(),
      });
      hasValue = true;
    }
    if (addressExtFields.length > 0) {
      addr.extension = [
        {
          url: 'http://fhir.openmrs.org/ext/address', // NOSONAR
          extension: addressExtFields,
        },
      ];
    }

    if (address.cityVillage?.trim()) {
      addr.city = address.cityVillage.trim();
      hasValue = true;
    }
    if (address.countyDistrict?.trim()) {
      addr.district = address.countyDistrict.trim();
      hasValue = true;
    }
    if (address.stateProvince?.trim()) {
      addr.state = address.stateProvince.trim();
      hasValue = true;
    }
    if (address.postalCode?.trim()) {
      addr.postalCode = address.postalCode.trim();
      hasValue = true;
    }
    if (hasValue) fhirAddresses.push(addr);
  }

  // Birth time
  const birthTimeISO = profile.birthTime
    ? convertTimeToISODateTime(profile.dateOfBirth, profile.birthTime)
    : null;

  const patient: Patient = {
    resourceType: 'Patient',
    ...(patientUuid && { id: patientUuid }),
    ...(identifiers.length > 0 ? { identifier: identifiers } : {}),
    name: [
      {
        ...(patientUuid && profile.nameUuid && { id: profile.nameUuid }),
        given,
        family: profile.lastName,
      },
    ],
    gender: mapGender(profile.gender),
    birthDate: buildBirthDate(profile.dateOfBirth, profile.dobEstimated),
    ...(birthTimeISO && {
      _birthDate: {
        extension: [
          {
            url: 'http://hl7.org/fhir/StructureDefinition/patient-birthTime', // NOSONAR
            valueDateTime: birthTimeISO,
          },
        ],
      },
    }),
    ...(extensions.length > 0 && { extension: extensions }),
    ...(fhirAddresses.length > 0 && { address: fhirAddresses }),
  };

  return patient;
}
