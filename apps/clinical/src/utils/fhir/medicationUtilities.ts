import { calculateEndDate, doDateRangesOverlap } from '@bahmni/services';
import {
  Medication,
  MedicationRequest as FhirMedicationRequest,
} from 'fhir/r4';

import { MedicationInputEntry } from '../../models/medication';

import { FHIRCode, extractCodesFromConcept } from './codeUtilities';

export const makeEndDateExclusive = (endDate: Date): Date => {
  const exclusiveEnd = new Date(endDate);
  exclusiveEnd.setDate(exclusiveEnd.getDate() - 1);
  return exclusiveEnd;
};

export const isDateToday = (startDate: Date | string | undefined): boolean => {
  if (!startDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateAtMidnight = new Date(startDate);
  dateAtMidnight.setHours(0, 0, 0, 0);

  return dateAtMidnight.getTime() === today.getTime();
};

export const isDateTodayOrPast = (
  startDate: Date | string | undefined,
): boolean => {
  if (!startDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateAtMidnight = new Date(startDate);
  dateAtMidnight.setHours(0, 0, 0, 0);

  return dateAtMidnight.getTime() <= today.getTime();
};

interface CodeableResource {
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
    }>;
  };
  medicationCodeableConcept?: {
    coding?: Array<{
      system?: string;
      code?: string;
    }>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export const extractMedicationCodes = (
  medication: CodeableResource | unknown,
): FHIRCode[] => {
  const codes: FHIRCode[] = [];
  const resource = medication as CodeableResource;

  if (resource?.code) {
    codes.push(...extractCodesFromConcept(resource.code));
  }

  if (resource?.medicationCodeableConcept) {
    codes.push(...extractCodesFromConcept(resource.medicationCodeableConcept));
  }

  return codes;
};

export const medicationsMatchByCode = (
  medication1: CodeableResource | unknown,
  medication2: CodeableResource | unknown,
): boolean => {
  if (!medication1 || !medication2) return false;
  const codes1 = extractMedicationCodes(medication1);
  const codes2 = extractMedicationCodes(medication2);

  if (codes1.length === 0 || codes2.length === 0) {
    return false;
  }

  for (const c1 of codes1) {
    for (const c2 of codes2) {
      if (c1.code === c2.code && c1.system === c2.system) {
        return true;
      }
    }
  }

  for (const c1 of codes1) {
    if (!c1.system) {
      for (const c2 of codes2) {
        if (!c2.system && c1.code === c2.code) {
          return true;
        }
      }
    }
  }

  return false;
};

export const extractMedicationRefId = (
  reference: string | undefined,
): string | undefined => {
  if (!reference) return undefined;
  const parts = reference.split('/');
  if (parts.length !== 2 || parts[0] !== 'Medication' || !parts[1])
    return undefined;
  return parts[1];
};

export const extractDoseForm = (
  medication: Record<string, unknown>,
  displayName: string,
): string | undefined => {
  const form = medication?.form as Record<string, unknown>;
  const coding = form?.coding as Array<Record<string, unknown>>;
  let doseForm =
    (form?.text as string | undefined) ??
    (coding?.[0]?.display as string | undefined) ??
    undefined;

  if (!doseForm && displayName) {
    const formMatch = displayName.match(/\(([^)]+)\)/);
    if (formMatch?.[1]) {
      const extracted = formMatch[1].trim();
      if (!/^\d+/.test(extracted)) {
        doseForm = extracted;
      }
    }
  }

  return doseForm;
};

export const checkMedicationsOverlap = (
  selectedMedications: MedicationInputEntry[],
  activeMedications: FhirMedicationRequest[],
  medicationMap: Record<string, Medication>,
): boolean => {
  for (let i = 0; i < selectedMedications.length; i++) {
    const current = selectedMedications[i];

    if (!current.startDate) continue;

    for (let j = i + 1; j < selectedMedications.length; j++) {
      const other = selectedMedications[j];

      if (!medicationsMatchByCode(current.medication, other.medication)) {
        continue;
      }

      if (current.isSTAT || other.isSTAT) {
        return true;
      }

      if (!other.startDate) continue;

      if (!current.durationUnit || !other.durationUnit) {
        continue;
      }

      const currentStart = new Date(current.startDate);
      currentStart.setHours(0, 0, 0, 0);
      const currentBaseDuration = current.duration > 0 ? current.duration : 1;
      const currentDuration =
        currentBaseDuration + (isDateToday(current.startDate) ? 1 : 0);
      const currentEndInclusive = calculateEndDate(
        currentStart,
        currentDuration,
        current.durationUnit?.code ?? 'd',
      );
      const currentEnd = makeEndDateExclusive(currentEndInclusive);

      const otherStart = new Date(other.startDate);
      otherStart.setHours(0, 0, 0, 0);
      const otherBaseDuration = other.duration > 0 ? other.duration : 1;
      const otherDuration =
        otherBaseDuration + (isDateToday(other.startDate) ? 1 : 0);
      const otherEndInclusive = calculateEndDate(
        otherStart,
        otherDuration,
        other.durationUnit?.code ?? 'd',
      );
      const otherEnd = makeEndDateExclusive(otherEndInclusive);

      if (doDateRangesOverlap(currentStart, currentEnd, otherStart, otherEnd)) {
        return true;
      }
    }

    const isExistingOverlap = activeMedications.some(
      (med: FhirMedicationRequest) => {
        const refId = extractMedicationRefId(
          med.medicationReference?.reference,
        );
        const medicationResource = refId ? medicationMap[refId] : null;

        if (
          !medicationResource ||
          !medicationsMatchByCode(current.medication, medicationResource)
        ) {
          return false;
        }

        const isImmediate = med.priority === 'stat';
        const startDate =
          med.dosageInstruction?.[0]?.timing?.event?.[0] ?? med.authoredOn;
        const duration =
          med.dosageInstruction?.[0]?.timing?.repeat?.duration ?? 1;
        const durationUnit =
          med.dosageInstruction?.[0]?.timing?.repeat?.durationUnit ?? 'd';

        if (isImmediate || current.isSTAT) return true;
        if (!startDate || !current.startDate) return false;

        if (!current.durationUnit) return false;

        const existingStart = new Date(startDate);
        existingStart.setHours(0, 0, 0, 0);
        const existingBaseDuration = duration > 0 ? duration : 1;
        const existingDuration =
          existingBaseDuration + (isDateTodayOrPast(startDate) ? 1 : 0);
        const existingEndInclusive = calculateEndDate(
          existingStart,
          existingDuration,
          durationUnit,
        );
        const existingEnd = makeEndDateExclusive(existingEndInclusive);

        const currentStart = new Date(current.startDate);
        currentStart.setHours(0, 0, 0, 0);
        const currentBaseDuration = current.duration > 0 ? current.duration : 1;
        const currentDuration =
          currentBaseDuration + (isDateToday(current.startDate) ? 1 : 0);
        const currentEndInclusive = calculateEndDate(
          currentStart,
          currentDuration,
          current.durationUnit?.code ?? 'd',
        );
        const currentEnd = makeEndDateExclusive(currentEndInclusive);

        return doDateRangesOverlap(
          existingStart,
          existingEnd,
          currentStart,
          currentEnd,
        );
      },
    );

    if (isExistingOverlap) return true;
  }

  return false;
};

export const isDuplicateMedication = (
  newMedication: Medication,
  newStartDate: Date,
  newDuration: number,
  newDurationUnit: string,
  activeMedications: FhirMedicationRequest[],
  selectedMedications: MedicationInputEntry[],
  medicationMap: Record<string, Medication>,
): boolean => {
  const baseDuration = newDuration > 0 ? newDuration : 1;
  const effectiveUnit = newDurationUnit ?? 'd';
  const effectiveDuration = baseDuration + (isDateToday(newStartDate) ? 1 : 0);
  const newStartDateNormalized = new Date(newStartDate);
  newStartDateNormalized.setHours(0, 0, 0, 0);
  const newEndDateInclusive = calculateEndDate(
    newStartDateNormalized,
    effectiveDuration,
    effectiveUnit,
  );
  const newEndDate = makeEndDateExclusive(newEndDateInclusive);

  const isExistingDuplicate = activeMedications.some(
    (med: FhirMedicationRequest) => {
      const refId = extractMedicationRefId(med.medicationReference?.reference);
      const medicationResource = refId ? medicationMap[refId] : null;

      if (
        !medicationResource ||
        !medicationsMatchByCode(newMedication, medicationResource)
      ) {
        return false;
      }

      const isImmediate = med.priority === 'stat';
      const startDate =
        med.dosageInstruction?.[0]?.timing?.event?.[0] ?? med.authoredOn;

      if (isImmediate) {
        return true;
      }

      if (!startDate) {
        return false;
      }

      const existingRawDuration =
        med.dosageInstruction?.[0]?.timing?.repeat?.duration ?? 1;
      const existingDurationUnit =
        med.dosageInstruction?.[0]?.timing?.repeat?.durationUnit ?? 'd';
      const existingBaseDuration =
        existingRawDuration > 0 ? existingRawDuration : 1;
      const existingDuration =
        existingBaseDuration + (isDateTodayOrPast(startDate) ? 1 : 0);

      const existingStartDate = new Date(startDate);
      existingStartDate.setHours(0, 0, 0, 0);
      const existingEndDateInclusive = calculateEndDate(
        existingStartDate,
        existingDuration,
        existingDurationUnit,
      );
      const existingEndDate = makeEndDateExclusive(existingEndDateInclusive);

      return doDateRangesOverlap(
        existingStartDate,
        existingEndDate,
        newStartDateNormalized,
        newEndDate,
      );
    },
  );

  const isSelectedDuplicate = selectedMedications.some(
    (selected: MedicationInputEntry) => {
      return medicationsMatchByCode(newMedication, selected.medication);
    },
  );

  return isExistingDuplicate || isSelectedDuplicate;
};

export const validateMedicationsForOverlaps = (
  selectedMedications: MedicationInputEntry[],
  activeMedications: FhirMedicationRequest[],
  medicationMap: Record<string, Medication>,
): boolean => {
  return !checkMedicationsOverlap(
    selectedMedications,
    activeMedications,
    medicationMap,
  );
};
