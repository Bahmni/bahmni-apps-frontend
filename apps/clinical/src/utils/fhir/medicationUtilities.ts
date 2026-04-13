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
