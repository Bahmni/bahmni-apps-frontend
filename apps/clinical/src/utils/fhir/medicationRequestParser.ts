import {
  MedicationRequest as FhirMedicationRequest,
  Medication,
} from 'fhir/r4';
import { DURATION_UNIT_OPTIONS } from '../../constants/medications';
import { Concept } from '../../models/encounterConcepts';
import {
  DurationUnitOption,
  MedicationInputEntry,
} from '../../models/medication';
import { MedicationConfig } from '../../models/medicationConfig';
import { extractDoseForm } from './medicationUtilities';

/**
 * Parses a FHIR MedicationRequest back into a MedicationInputEntry for editing.
 * Resolves concept UUIDs from FHIR coding back to Concept objects using medication config.
 */
export function parseFhirToMedicationInputEntry(
  fhirMedRequest: FhirMedicationRequest,
  medicationConfig: MedicationConfig,
): MedicationInputEntry {
  const dosageInstruction = fhirMedRequest.dosageInstruction?.[0];

  const medication = buildMedicationResource(fhirMedRequest);
  const displayName =
    fhirMedRequest.medicationReference?.display ?? 'Medication';

  const dosage = dosageInstruction?.doseAndRate?.[0]?.doseQuantity?.value ?? 0;
  const dosageUnitCode =
    dosageInstruction?.doseAndRate?.[0]?.doseQuantity?.code;
  const dosageUnit = resolveConceptByUuid(
    dosageUnitCode,
    medicationConfig.doseUnits,
  );

  const frequencyCode = dosageInstruction?.timing?.code?.coding?.[0]?.code;
  const frequency = resolveFrequencyByUuid(
    frequencyCode,
    medicationConfig.frequencies,
  );

  const routeCode = dosageInstruction?.route?.coding?.[0]?.code;
  const route = resolveConceptByUuid(routeCode, medicationConfig.routes);

  const repeat = dosageInstruction?.timing?.repeat;
  const duration = repeat?.duration ?? 0;
  const durationUnitCode = repeat?.durationUnit;
  const durationUnit = resolveDurationUnit(durationUnitCode);

  const instruction = resolveInstruction(
    dosageInstruction?.text,
    medicationConfig.dosingInstructions,
  );

  const isPRN = dosageInstruction?.asNeededBoolean ?? false;
  const isSTAT = fhirMedRequest.priority === 'stat';

  const startDate = parseStartDate(fhirMedRequest, isSTAT);

  const dispenseQuantity = fhirMedRequest.dispenseRequest?.quantity?.value ?? 0;
  const dispenseUnitCode = fhirMedRequest.dispenseRequest?.quantity?.code;
  const dispenseUnit = resolveConceptByUuid(
    dispenseUnitCode,
    medicationConfig.doseUnits,
  );

  const note =
    fhirMedRequest.note
      ?.map((n) => n.text)
      .filter(Boolean)
      .join(' ') ?? '';

  const doseForm = extractDoseForm(
    medication as Record<string, unknown>,
    displayName,
  );

  return {
    id: fhirMedRequest.id!,
    fhirResourceId: fhirMedRequest.id!,
    medication,
    display: displayName,
    dosage,
    dosageUnit,
    frequency,
    instruction,
    route,
    duration,
    durationUnit,
    isSTAT,
    isPRN,
    startDate,
    dispenseQuantity,
    dispenseUnit,
    doseForm,
    note,
    errors: {},
    hasBeenValidated: false,
  };
}

function buildMedicationResource(
  fhirMedRequest: FhirMedicationRequest,
): Medication {
  const refId = fhirMedRequest.medicationReference?.reference?.split('/').pop();

  // Check for contained Medication resource first
  const contained = fhirMedRequest.contained?.find(
    (r) => r.resourceType === 'Medication',
  ) as Medication | undefined;

  if (contained) {
    return { ...contained, id: contained.id ?? refId };
  }

  return {
    resourceType: 'Medication',
    id: refId,
    code: {
      text: fhirMedRequest.medicationReference?.display,
    },
  };
}

function resolveConceptByUuid(
  uuid: string | undefined,
  concepts: Concept[] | undefined,
): Concept | null {
  if (!uuid || !concepts) return null;
  return concepts.find((c) => c.uuid === uuid) ?? null;
}

function resolveFrequencyByUuid(
  uuid: string | undefined,
  frequencies: MedicationConfig['frequencies'] | undefined,
): MedicationConfig['frequencies'][number] | null {
  if (!uuid || !frequencies) return null;
  return frequencies.find((f) => f.uuid === uuid) ?? null;
}

function resolveDurationUnit(
  code: string | undefined,
): DurationUnitOption | null {
  if (!code) return null;
  return DURATION_UNIT_OPTIONS.find((u) => u.code === code) ?? null;
}

function resolveInstruction(
  dosageText: string | undefined,
  dosingInstructions: Concept[] | undefined,
): Concept | null {
  if (!dosageText || !dosingInstructions) return null;
  try {
    const parsed = JSON.parse(dosageText);
    const instructionName = parsed.instructions;
    if (!instructionName) return null;
    return dosingInstructions.find((i) => i.name === instructionName) ?? null;
  } catch {
    return null;
  }
}

function parseStartDate(
  fhirMedRequest: FhirMedicationRequest,
  isSTAT: boolean,
): Date {
  if (isSTAT) {
    return new Date();
  }
  const startDateStr =
    fhirMedRequest.dosageInstruction?.[0]?.timing?.repeat?.boundsPeriod
      ?.start ?? fhirMedRequest.dosageInstruction?.[0]?.timing?.event?.[0];

  if (startDateStr) {
    return new Date(startDateStr);
  }
  return new Date();
}
