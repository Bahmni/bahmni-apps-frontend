import {
  createBundleEntry,
  resolveComboBoxItems,
  formatDateTime,
  Location,
  type AvailableStockResponse,
} from '@bahmni/services';
import {
  BundleEntry,
  Extension,
  Immunization,
  Medication,
  MedicationRequest,
  ValueSet,
  ValueSetExpansionContains,
} from 'fhir/r4';
import { InputControlAttributes } from '../../../providers/clinicalConfig/models';
import { getMedicationDisplay } from '../../../services/medicationService';
import {
  createEncounterReferenceFromString,
  createPractitionerReference,
} from '../../../utils/fhir/referenceCreator';
import {
  ADMINISTERED_PRODUCT_EXTENSION_URL,
  BASED_ON_EXTENSION_URL,
  STOCK_LOCATION_EXTENSION_URL,
  ENTERING_PROVIDER_CODE,
  ENTERING_PROVIDER_DISPLAY,
  ENTERING_PROVIDER_SYSTEM,
} from './constants';
import {
  BatchNumberComboBoxItem,
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

function resolveBasedOnExtension(
  basedOnReference: string | null | undefined,
): Extension[] {
  if (!basedOnReference) return [];
  return [
    {
      url: BASED_ON_EXTENSION_URL,
      valueReference: { reference: `MedicationRequest/${basedOnReference}` },
    },
  ];
}

function resolveStockLocationExtension(
  stockLocation: string | null | undefined,
): Extension[] {
  if (!stockLocation?.trim()) return [];
  return [
    {
      url: STOCK_LOCATION_EXTENSION_URL,
      valueString: stockLocation,
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

export function getAllValueSetComboBoxItems(
  searchTerm: string,
  valueSet: ValueSet | undefined,
  emptyMessage: string,
): ValueSetComboBoxItem[] {
  const contains = valueSet?.expansion?.contains ?? [];
  const filtered = searchTerm.trim()
    ? contains.filter((item) =>
        item.display?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : contains;
  const items = filtered.map(({ code = '', display = '' }) => ({
    code,
    display,
  }));
  if (!items.length) {
    return [{ code: '', display: emptyMessage, disabled: true }];
  }
  return items;
}

export function getVaccineComboBoxItems(
  searchTerm: string,
  medications: Medication[] | undefined,
  emptyMessage: string,
): ValueSetComboBoxItem[] {
  if (!searchTerm.trim()) return [];
  const seen = new Set<string>();
  const items: ValueSetComboBoxItem[] = [];
  (medications ?? []).forEach((med) => {
    const code = med.code?.coding?.[0]?.code;
    if (!code || seen.has(code)) return;
    const display = med.code?.coding?.[0]?.display ?? med.code?.text ?? code;
    if (!display.toLowerCase().includes(searchTerm.toLowerCase())) return;
    seen.add(code);
    items.push({ code, display });
  });
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

export function getBatchNumberComboBoxItems(
  availableStocks: AvailableStockResponse | undefined,
  errorMessage?: string,
  emptyMessage?: string,
): BatchNumberComboBoxItem[] {
  if (errorMessage) {
    return [
      {
        batchNumber: errorMessage,
        expiryDate: '',
        stockLocationName: '',
        disabled: true,
      },
    ];
  }
  if (emptyMessage) {
    return [
      {
        batchNumber: emptyMessage,
        expiryDate: '',
        stockLocationName: '',
        disabled: true,
      },
    ];
  }
  return (availableStocks?.data ?? [])
    .filter(({ batchNumber }) => !!batchNumber?.trim())
    .map(({ batchNumber, expiryDate, stockLocationName }) => ({
      batchNumber: batchNumber.trim(),
      expiryDate,
      stockLocationName,
    }));
}

export function formatBatchItemDisplay(
  item: BatchNumberComboBoxItem | null,
  t: (key: string) => string,
): string {
  if (!item) return '';
  const expiryPart = item.expiryDate
    ? ` [${formatDateTime(item.expiryDate, t, false, 'd MMM yyyy').formattedResult}]`
    : '';
  const locationPart = item.stockLocationName
    ? ` - ${item.stockLocationName}`
    : '';
  return item.batchNumber + expiryPart + locationPart;
}

export function getLocationComboBoxItems(
  searchTerm: string,
  locations: Location[] | undefined,
): LocationComboBoxItem[] {
  if (!searchTerm.trim()) return [];
  return (locations ?? [])
    .flatMap((location) => [location, ...(location.childLocations ?? [])])
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

export function buildBasedOnImmunizationEntry(
  basedOn: MedicationRequest,
  basedOnMedication: Medication,
  loginLocation: { uuid?: string; display?: string; name: string },
) {
  const vaccineCode = {
    code: basedOnMedication.code?.coding?.[0]?.code,
    display: basedOn.medicationReference?.display,
  };

  const medicationDisplay = basedOn.medicationReference?.display;
  const drug = medicationDisplay
    ? { code: basedOnMedication.id, display: medicationDisplay }
    : null;

  const administeredLocation = {
    uuid: loginLocation.uuid,
    display: loginLocation.display ?? loginLocation.name,
  };

  return {
    vaccineCode,
    defaults: {
      drug,
      administeredOn: new Date(),
      administeredLocation,
      basedOnReference: basedOn.id,
    },
  };
}

export function createImmunizationBundleEntries({
  selectedImmunizations,
  encounterSubject,
  encounterReference,
  practitionerUUID,
  isAdministration,
  isWaiver,
}: CreateImmunizationBundleEntriesParams): BundleEntry[] {
  return selectedImmunizations.map((entry) => {
    const extensions = [
      ...(entry.drug ? resolveAdministeredProductExtension(entry.drug) : []),
      ...resolveBasedOnExtension(entry.basedOnReference),
      ...resolveStockLocationExtension(entry.stockLocation),
    ];
    const administeredOnlyFields = isWaiver
      ? {}
      : {
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
        };
    const resource: Immunization = {
      resourceType: 'Immunization',
      id: entry.id,
      status: isWaiver ? 'not-done' : 'completed',
      vaccineCode: {
        coding: [
          { code: entry.vaccineCode.code, display: entry.vaccineCode.display },
        ],
      },
      patient: encounterSubject,
      primarySource: isAdministration,
      occurrenceDateTime: entry.administeredOn?.toISOString(),
      location: entry.administeredLocation
        ? resolveLocationReference(entry.administeredLocation)
        : undefined,
      statusReason: entry.statusReason
        ? {
            coding: [
              {
                code: entry.statusReason.code,
                display: entry.statusReason.display,
              },
            ],
          }
        : undefined,
      ...administeredOnlyFields,
      note: entry.note
        ? [
            {
              text: entry.note,
              authorReference: createPractitionerReference(practitionerUUID),
            },
          ]
        : undefined,
      extension: extensions.length > 0 ? extensions : undefined,
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

    return createBundleEntry(`urn:uuid:${entry.id}`, resource, 'POST');
  });
}
