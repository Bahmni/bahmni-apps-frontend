import { generateUUID, resolveComboBoxItems, Location } from '@bahmni/services';
import {
  Extension,
  Medication,
  ValueSet,
  ValueSetExpansionContains,
  BundleEntry,
  Immunization,
} from 'fhir/r4';
import { InputControlAttributes } from '../../../providers/clinicalConfig/models';
import { getMedicationDisplay } from '../../../services/medicationService';
import { createBundleEntry } from '../../../utils/fhir/consultationBundleCreator';
import {
  createEncounterReferenceFromString,
  createPractitionerReference,
} from '../../../utils/fhir/referenceCreator';
import {
  ADMINISTERED_PRODUCT_EXTENSION_URL,
  ENTERING_PROVIDER_CODE,
  ENTERING_PROVIDER_DISPLAY,
  ENTERING_PROVIDER_SYSTEM,
} from './constants';
import {
  CreateImmunizationBundleEntriesParams,
  ImmunizationDrug,
  ImmunizationLocation,
  LocationComboBoxItem,
  ValueSetComboBoxItem,
} from './models';

function resolveAdministeredProductExtension(
  drug: ImmunizationDrug,
): Extension[] {
  return [
    {
      url: ADMINISTERED_PRODUCT_EXTENSION_URL,
      valueReference: drug.code
        ? { reference: `Medication/${drug.code}`, display: drug.display }
        : { display: drug.display },
    },
  ];
}

function resolveLocationReference(
  location: ImmunizationLocation,
): { reference: string } | { display: string } {
  if (location.uuid) {
    return { reference: `Location/${location.uuid}` };
  }
  return { display: location.display };
}

export function findAttr(
  name: string,
  attributes: InputControlAttributes[] | undefined,
): InputControlAttributes | undefined {
  return attributes?.find((a) => a.name === name);
}

export function getValueSetComboBoxItems(
  searchTerm: string,
  valueSet: ValueSet | undefined,
  emptyMessage: string,
): ValueSetComboBoxItem[] {
  if (!searchTerm.trim()) return [];
  const items = (valueSet?.expansion?.contains ?? [])
    .filter((item) =>
      item.display?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .map(({ code = '', display = '' }) => ({ code, display }));
  if (!items.length) {
    return [{ code: '', display: emptyMessage, disabled: true }];
  }
  return items;
}

export function getMedicationComboBoxItems(
  searchTerm: string,
  medications: Medication[] | undefined,
  vaccineCode: string,
  emptyMessage: string,
): ValueSetComboBoxItem[] {
  if (!searchTerm.trim()) return [];
  const byVaccineCode = (medications ?? []).filter((med) =>
    med.code?.coding?.some((c) => c.code === vaccineCode),
  );
  if (!byVaccineCode.length) {
    return [{ code: '', display: emptyMessage, disabled: true }];
  }
  return byVaccineCode
    .filter((med) =>
      getMedicationDisplay(med)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    )
    .map((med) => ({
      code: med.id ?? '',
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
        ? resolveLocationReference(entry.administeredLocation)
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
      protocolApplied: entry.doseSequence
        ? [{ doseNumberPositiveInt: entry.doseSequence }]
        : undefined,
      note: entry.note
        ? [
            {
              text: entry.note,
              authorReference: createPractitionerReference(practitionerUUID),
            },
          ]
        : undefined,
      extension: entry.drug
        ? resolveAdministeredProductExtension(entry.drug)
        : undefined,
      encounter: createEncounterReferenceFromString(encounterReference),
      performer: [
        {
          function: {
            coding: [
              {
                system: ENTERING_PROVIDER_SYSTEM,
                code: ENTERING_PROVIDER_CODE,
                display: ENTERING_PROVIDER_DISPLAY,
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
