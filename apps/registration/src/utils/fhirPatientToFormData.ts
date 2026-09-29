import {
  calculateAge,
  formatDateTime,
  type PersonAttributeType,
  type TelecomAttributeTypeMapping,
} from '@bahmni/services';
import { format, isValid, parseISO } from 'date-fns';
import type { ContactPoint, Patient } from 'fhir/r4';
import type { AddressData } from '../hooks/useAddressFields';
import type { BasicInfoData, PersonAttributesData } from '../models/patient';
import {
  PATIENT_ATTRIBUTE_PREFIX,
  ADDRESS_EXT_URL,
  BIRTH_TIME_EXT_URL,
  DATE_CREATED_EXT_URL,
  toSlugCase,
  mapGenderFromFhir,
} from './fhirUtils';

function parseBirthDate(birthDate?: string): {
  dateOfBirth: string;
  estimated: boolean;
} {
  if (!birthDate) return { dateOfBirth: '', estimated: false };
  const len = birthDate.length;
  if (len === 4) return { dateOfBirth: `${birthDate}-01-01`, estimated: true };
  if (len === 7) return { dateOfBirth: `${birthDate}-01`, estimated: true };
  return { dateOfBirth: birthDate, estimated: false };
}

function extractBirthTime(patient: Patient): string {
  const el = (patient as Record<string, unknown>)._birthDate as
    | { extension?: { url: string; valueDateTime?: string }[] }
    | undefined;
  const ext = el?.extension?.find((e) => e.url === BIRTH_TIME_EXT_URL);
  if (!ext?.valueDateTime) return '';
  const date = parseISO(ext.valueDateTime);
  return isValid(date) ? format(date, 'HH:mm') : '';
}

export function convertFhirToBasicInfo(
  patient: Patient,
  getGenderDisplay?: (code: string) => string,
): BasicInfoData {
  const name = patient.name?.[0];
  const given = name?.given ?? [];
  const genderCode = mapGenderFromFhir(patient.gender ?? '');
  const { dateOfBirth, estimated } = parseBirthDate(patient.birthDate);
  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;

  return {
    patientIdFormat: '',
    entryType: estimated,
    firstName: given[0] ?? '',
    middleName: given.slice(1).join(' '),
    lastName: name?.family ?? '',
    gender: getGenderDisplay?.(genderCode) ?? genderCode,
    ageYears: age?.years.toString() ?? '',
    ageMonths: age?.months.toString() ?? '',
    ageDays: age?.days.toString() ?? '',
    dateOfBirth,
    birthTime: extractBirthTime(patient),
    nameUuid: name?.id,
  };
}

const byRank = (a: { rank?: number }, b: { rank?: number }) =>
  (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER);

/**
 * Resolves Patient.telecom ContactPoints to person attribute names using the admin-configured
 * fhir2Extension.telecomAttributeTypeMap (same mapping the backend uses to build telecom from
 * attributes), instead of assuming fixed attribute names. A ContactPoint carries only
 * system/use/rank, so within each system, telecom entries and mapping entries are both sorted by
 * rank and paired positionally (e.g. rank-1 "phone" telecom value <-> rank-1 "phone" mapping entry).
 */
function populateContactAttributesFromTelecom(
  patient: Patient,
  attrNameByUuid: Map<string, string>,
  telecomAttributeTypeMap: TelecomAttributeTypeMapping[],
  data: PersonAttributesData,
): Set<string> {
  const populated = new Set<string>();
  const telecom = patient.telecom ?? [];
  if (telecom.length === 0 || telecomAttributeTypeMap.length === 0) {
    return populated;
  }

  const contactPointsBySystem = new Map<string, ContactPoint[]>();
  telecom.forEach((cp) => {
    if (!cp.system || !cp.value) return;
    const entries = contactPointsBySystem.get(cp.system) ?? [];
    entries.push(cp);
    contactPointsBySystem.set(cp.system, entries);
  });

  const mappingsBySystem = new Map<string, TelecomAttributeTypeMapping[]>();
  telecomAttributeTypeMap.forEach((mapping) => {
    const entries = mappingsBySystem.get(mapping.system) ?? [];
    entries.push(mapping);
    mappingsBySystem.set(mapping.system, entries);
  });

  contactPointsBySystem.forEach((contactPoints, system) => {
    const mappings = mappingsBySystem.get(system);
    if (!mappings) return;

    contactPoints.sort(byRank);
    mappings.sort(byRank);

    contactPoints.forEach((cp, index) => {
      const attrName = attrNameByUuid.get(
        mappings[index]?.attributeTypeUuid ?? '',
      );
      if (attrName) {
        data[attrName] = cp.value as string;
        populated.add(attrName);
      }
    });
  });

  return populated;
}

export function convertFhirToPersonAttributes(
  patient: Patient,
  personAttributes: PersonAttributeType[],
  telecomAttributeTypeMap: TelecomAttributeTypeMapping[] = [],
): PersonAttributesData | undefined {
  const slugToName: Record<string, string> = {};
  const attrNameByUuid = new Map<string, string>();
  personAttributes.forEach((attr) => {
    slugToName[toSlugCase(attr.name)] = attr.name;
    attrNameByUuid.set(attr.uuid, attr.name);
  });

  const data: PersonAttributesData = {};

  // Prefer Patient.telecom for contact attributes (phone/email); only fall back to the
  // legacy generic-attribute extensions for whichever of those isn't present in telecom,
  // so both old (extension-only) and new (telecom) patient records render correctly.
  const populatedFromTelecom = populateContactAttributesFromTelecom(
    patient,
    attrNameByUuid,
    telecomAttributeTypeMap,
    data,
  );
  let found = populatedFromTelecom.size > 0;

  for (const ext of patient.extension ?? []) {
    if (!ext.url?.startsWith(PATIENT_ATTRIBUTE_PREFIX)) continue;
    const slug = ext.url.substring(PATIENT_ATTRIBUTE_PREFIX.length);
    const attrName = slugToName[slug];
    if (!attrName || populatedFromTelecom.has(attrName)) continue;

    const value = ext.valueString ?? ext.valueBoolean;
    if (value !== undefined) {
      data[attrName] = typeof value === 'boolean' ? value : String(value);
      found = true;
    }
  }

  return found ? data : undefined;
}

export function convertFhirToAddressData(
  patient: Patient,
): AddressData | undefined {
  const addr = patient.address?.[0];
  if (!addr) return undefined;

  const data: AddressData = {};
  if (addr.city) data.cityVillage = addr.city;
  if (addr.district) data.countyDistrict = addr.district;
  if (addr.state) data.stateProvince = addr.state;
  if (addr.postalCode) data.postalCode = addr.postalCode;
  if (addr.country) data.country = addr.country;

  const addrExt = addr.extension?.find((e) => e.url === ADDRESS_EXT_URL);
  if (addrExt?.extension) {
    for (const sub of addrExt.extension) {
      if (sub.url?.endsWith('#address1') && sub.valueString)
        data.address1 = sub.valueString;
      if (sub.url?.endsWith('#address2') && sub.valueString)
        data.address2 = sub.valueString;
    }
  }

  return Object.keys(data).length > 0 ? data : undefined;
}

export function convertFhirToAdditionalIdentifiers(
  patient: Patient,
): Record<string, string> | undefined {
  const identifiers = patient.identifier ?? [];
  if (identifiers.length <= 1) return undefined;

  const data: Record<string, string> = {};
  identifiers.slice(1).forEach((id) => {
    const typeCode = id.type?.coding?.[0]?.code;
    if (typeCode && id.value) data[typeCode] = id.value;
  });

  return Object.keys(data).length > 0 ? data : undefined;
}

export function extractMetadata(
  patient: Patient,
  t: (key: string) => string,
): {
  patientUuid: string;
  patientIdentifier: string;
  patientName: string;
  registerDate: string;
} {
  const dateCreatedExt = patient.extension?.find(
    (e) => e.url === DATE_CREATED_EXT_URL,
  );
  let registerDate = '';
  if (dateCreatedExt?.valueDateTime) {
    const result = formatDateTime(dateCreatedExt.valueDateTime, t);
    if (!result.error) registerDate = result.formattedResult;
  }

  const displayName = [
    patient.name?.[0]?.given?.join(' '),
    patient.name?.[0]?.family,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    patientUuid: patient.id ?? '',
    patientIdentifier: patient.identifier?.[0]?.value ?? '',
    patientName: displayName,
    registerDate,
  };
}

export function extractDobEstimated(patient: Patient): boolean {
  return parseBirthDate(patient.birthDate).estimated;
}
