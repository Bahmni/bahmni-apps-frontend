import { generateUUID, resolveComboBoxItems, Location } from '@bahmni/services';
import {
  Medication,
  ValueSet,
  ValueSetExpansionContains,
  BundleEntry,
  Immunization,
} from 'fhir/r4';
import { getMedicationDisplay } from '../../../services/medicationService';
import { createBundleEntry } from '../../../utils/fhir/consultationBundleCreator';
import {
  createEncounterReferenceFromString,
  createPractitionerReference,
} from '../../../utils/fhir/referenceCreator';
import {
  CreateImmunizationBundleEntriesParams,
  LocationComboBoxItem,
  ValueSetComboBoxItem,
} from './models';

export function getValueSetComboBoxItems(
  searchTerm: string,
  valueSet: ValueSet | undefined,
): ValueSetComboBoxItem[] {
  if (!searchTerm.trim()) return [];
  return (valueSet?.expansion?.contains ?? [])
    .filter((item) =>
      item.display?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .map(({ code = '', display = '' }) => ({ code, display }));
}

export function getMedicationComboBoxItems(
  searchTerm: string,
  medications: Medication[] | undefined,
): ValueSetComboBoxItem[] {
  if (!searchTerm.trim()) return [];
  return (medications ?? [])
    .filter((med) =>
      getMedicationDisplay(med)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    )
    .map((med) => ({
      code: med.code?.coding?.[0]?.code ?? '',
      display: getMedicationDisplay(med),
    }));
}

export function getLocationComboBoxItems(
  searchTerm: string,
  locations: Location[] | undefined,
): LocationComboBoxItem[] {
  if (!searchTerm.trim()) return [];
  return (locations ?? [])
    .flatMap((location) => [location, ...location.childLocations])
    .filter((location) =>
      location.display.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .map(({ uuid, display }) => ({ uuid, display }));
}

export function getComboBoxItems(
  searchTerm: string,
  codeableConcepts: ValueSet | undefined,
  isLoading: boolean,
  isError: boolean,
  messages: { loading: string; error: string; empty: string },
): (ValueSetExpansionContains & { disabled?: boolean })[] {
  if (!searchTerm.trim()) return [];
  const contains = codeableConcepts?.expansion?.contains ?? [];
  const filtered = contains.filter((item) =>
    item.display?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  return resolveComboBoxItems(
    isLoading,
    isError,
    filtered,
    (message) => ({ display: message }),
    messages,
  );
}

export function createImmunizationBundleEntries({
  selectedImmunizations,
  encounterSubject,
  encounterReference,
  practitionerUUID,
}: CreateImmunizationBundleEntriesParams): BundleEntry[] {
  return selectedImmunizations.map((entry) => {
    const resource: Immunization = {
      resourceType: 'Immunization',
      status: 'completed',
      vaccineCode: {
        coding: [
          { code: entry.vaccineCode.code, display: entry.vaccineCode.display },
        ],
      },
      patient: encounterSubject,
      occurrenceDateTime: entry.administeredOn?.toISOString(),
      location: entry.administeredLocation
        ? { reference: `Location/${entry.administeredLocation}` }
        : undefined,
      route: entry.route ? { coding: [{ code: entry.route }] } : undefined,
      site: entry.site ? { coding: [{ code: entry.site }] } : undefined,
      expirationDate: entry.expiryDate
        ? entry.expiryDate.toISOString().split('T')[0]
        : undefined,
      manufacturer: entry.manufacturer
        ? { display: entry.manufacturer }
        : undefined,
      lotNumber: entry.batchNumber ?? undefined,
      encounter: createEncounterReferenceFromString(encounterReference),
      performer: [
        {
          function: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0443',
                code: 'AP',
                display: 'Administering Provider',
              },
            ],
          },
          actor: createPractitionerReference(practitionerUUID),
        },
      ],
    };

    return createBundleEntry(`urn:uuid:${generateUUID()}`, resource, 'POST');
  });
}
