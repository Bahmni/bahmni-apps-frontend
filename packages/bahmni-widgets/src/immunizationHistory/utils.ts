import { Immunization } from 'fhir/r4';
import {
  ENTERING_PROVIDER_CODE,
  FHIR_EXT_IMMUNIZATION_DRUG,
  ORDERING_PROVIDER_CODE,
} from './constants';
import {
  AdministeredImmunizationViewModel,
  NotAdministeredImmunizationViewModel,
} from './model';

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

function getDoseNumber(immunization: Immunization): string | null {
  const doseNumber =
    immunization.protocolApplied?.[0]?.doseNumberPositiveInt ??
    immunization.protocolApplied?.[0]?.doseNumberString;
  return doseNumber ? doseNumber.toString() : null;
}

export function createAdministeredImmunizationViewModel(
  immunization: Immunization,
): AdministeredImmunizationViewModel {
  const route = immunization.route?.coding?.[0]?.display ?? null;
  const site = immunization.site?.coding?.[0]?.display ?? null;
  const manufacturer = immunization.manufacturer?.display ?? null;
  const batchNumber = immunization.lotNumber ?? null;
  const recordedBy = getPerformerDisplay(immunization, ENTERING_PROVIDER_CODE);
  const orderedBy = getPerformerDisplay(immunization, ORDERING_PROVIDER_CODE);
  const notes = immunization.note?.[0]?.text ?? null;

  return {
    id: immunization.id ?? '',
    code: immunization.vaccineCode?.coding?.[0]?.display ?? null,
    doseSequence: getDoseNumber(immunization),
    drugName: getDrugDisplay(immunization) ?? null,
    administeredOn: immunization.occurrenceDateTime ?? null,
    administeredLocation: immunization.location?.display ?? null,
    route,
    site,
    manufacturer,
    batchNumber,
    recordedBy,
    orderedBy,
    notes,
    hasDetails: !!(
      route ??
      site ??
      manufacturer ??
      batchNumber ??
      recordedBy ??
      orderedBy
    ),
  };
}

export function createNotAdministeredImmunizationViewModel(
  immunization: Immunization,
): NotAdministeredImmunizationViewModel {
  return {
    id: immunization.id ?? '',
    code: immunization.vaccineCode?.coding?.[0]?.display ?? null,
    reason: immunization.statusReason?.coding?.[0]?.display ?? null,
    date: immunization.occurrenceDateTime ?? null,
    recordedBy: getPerformerDisplay(immunization, ENTERING_PROVIDER_CODE),
  };
}
