import { Immunization } from 'fhir/r4';

const FHIR_EXT_IMMUNIZATION_DRUG =
  'http://fhir.bahmni.org/ext/immunization/administeredProduct';
const ADMINISTERING_PROVIDER_CODE = 'AP';
const ORDERING_PROVIDER_CODE = 'OP';

export interface AdministeredRow {
  id: string;
  code: string;
  doseSequence: string;
  drugName: string;
  administeredOn: string;
  administeredLocation: string;
  status: string;
  route: string | null;
  site: string | null;
  manufacturer: string | null;
  batchNumber: string | null;
  recordedBy: string | null;
  orderedBy: string | null;
  notes: string | null;
}

export interface NotAdministeredRow {
  id: string;
  code: string;
  reason: string;
  date: string;
  recordedBy: string;
}

function getPerformerDisplay(
  immunization: Immunization,
  code: string,
): string | null {
  return (
    immunization.performer?.find((p) =>
      p.function?.coding?.some((c) => c.code === code),
    )?.actor?.display ?? null
  );
}

function getDrugDisplay(immunization: Immunization): string | null {
  return (
    immunization.extension?.find((e) => e.url === FHIR_EXT_IMMUNIZATION_DRUG)
      ?.valueReference?.display ?? null
  );
}

function getDoseNumber(immunization: Immunization): string {
  const doseNumber =
    immunization.protocolApplied?.[0]?.doseNumberPositiveInt ??
    immunization.protocolApplied?.[0]?.doseNumberString;
  return doseNumber ? doseNumber.toString() : '-';
}

export function toAdministeredRow(immunization: Immunization): AdministeredRow {
  return {
    id: immunization.id ?? '',
    code: immunization.vaccineCode?.coding?.[0]?.display ?? '',
    doseSequence: getDoseNumber(immunization),
    drugName: getDrugDisplay(immunization) ?? '-',
    administeredOn: immunization.occurrenceDateTime ?? '',
    administeredLocation: immunization.location?.display ?? '-',
    status: immunization.status ?? '',
    route: immunization.route?.coding?.[0]?.display ?? null,
    site: immunization.site?.coding?.[0]?.display ?? null,
    manufacturer: immunization.manufacturer?.display ?? null,
    batchNumber: immunization.lotNumber ?? null,
    recordedBy: getPerformerDisplay(immunization, ADMINISTERING_PROVIDER_CODE),
    orderedBy: getPerformerDisplay(immunization, ORDERING_PROVIDER_CODE),
    notes: immunization.note?.[0]?.text ?? null,
  };
}

export function hasAdministeredRowDetails(row: AdministeredRow): boolean {
  return !!(
    row.route ||
    row.site ||
    row.manufacturer ||
    row.batchNumber ||
    row.recordedBy ||
    row.orderedBy ||
    row.notes
  );
}

export function toNotAdministeredRow(
  immunization: Immunization,
): NotAdministeredRow {
  return {
    id: immunization.id ?? '',
    code: immunization.vaccineCode?.coding?.[0]?.display ?? '',
    reason: immunization.statusReason?.coding?.[0]?.display ?? '',
    date: immunization.occurrenceDateTime ?? '',
    recordedBy:
      getPerformerDisplay(immunization, ADMINISTERING_PROVIDER_CODE) ?? '',
  };
}
