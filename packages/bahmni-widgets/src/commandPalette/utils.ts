import type { PatientSearchResult } from '@bahmni/services';
import type { PatientFieldKey } from './models';

export interface FieldDef {
  labelKey: string;
  getValue: (p: PatientSearchResult) => string | null | undefined;
}

export const FIELD_LABEL_KEYS = {
  name: 'COMMAND_PALETTE_FIELD_NAME',
  identifier: 'COMMAND_PALETTE_FIELD_ID',
  age: 'COMMAND_PALETTE_FIELD_AGE',
  gender: 'COMMAND_PALETTE_FIELD_GENDER',
  birthDate: 'COMMAND_PALETTE_FIELD_DOB',
  addressFieldValue: 'COMMAND_PALETTE_FIELD_ADDRESS',
  extraIdentifiers: 'COMMAND_PALETTE_FIELD_EXTRA_IDS',
  customAttribute: 'COMMAND_PALETTE_FIELD_ATTRIBUTE',
  activeVisitUuid: 'COMMAND_PALETTE_FIELD_ACTIVE_VISIT',
} as const satisfies Record<PatientFieldKey, string>;

export const PATIENT_FIELD_MAP: Record<PatientFieldKey, FieldDef> = {
  name: {
    labelKey: FIELD_LABEL_KEYS.name,
    getValue: (p) =>
      [p.givenName, p.middleName, p.familyName].filter(Boolean).join(' '),
  },
  identifier: {
    labelKey: FIELD_LABEL_KEYS.identifier,
    getValue: (p) => p.identifier,
  },
  age: {
    labelKey: FIELD_LABEL_KEYS.age,
    getValue: (p) => p.age,
  },
  gender: {
    labelKey: FIELD_LABEL_KEYS.gender,
    getValue: (p) => p.gender,
  },
  birthDate: {
    labelKey: FIELD_LABEL_KEYS.birthDate,
    getValue: (p) => (p.birthDate ? String(p.birthDate) : null),
  },
  addressFieldValue: {
    labelKey: FIELD_LABEL_KEYS.addressFieldValue,
    getValue: (p) => p.addressFieldValue,
  },
  extraIdentifiers: {
    labelKey: FIELD_LABEL_KEYS.extraIdentifiers,
    getValue: (p) => p.extraIdentifiers,
  },
  customAttribute: {
    labelKey: FIELD_LABEL_KEYS.customAttribute,
    getValue: (p) => p.customAttribute,
  },
  activeVisitUuid: {
    labelKey: FIELD_LABEL_KEYS.activeVisitUuid,
    getValue: (p) => (p.activeVisitUuid ? 'Active' : null),
  },
};

export const filterItems = (value: string, search: string): number => {
  if (value.startsWith('patient:')) return 1;
  if (search.length < 2) return 1;
  return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
};

export function getInitials(givenName: string, familyName: string): string {
  const first = givenName?.[0] ?? '';
  const last = familyName?.[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

export function buildPrimaryText(
  patient: PatientSearchResult,
  primaryFields: PatientFieldKey[],
): string {
  return primaryFields
    .map((key) => PATIENT_FIELD_MAP[key].getValue(patient))
    .filter(Boolean)
    .join(' · ');
}

export const DEFAULT_DOUBLE_INTERVAL = 350;

function parseKeys(keys: string): {
  key: string;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
} {
  const parts = keys.toLowerCase().split('+');
  const key = parts.at(-1)!;
  const mods = new Set(parts.slice(0, -1));
  return {
    key,
    meta: mods.has('meta') || mods.has('cmd'),
    ctrl: mods.has('ctrl'),
    shift: mods.has('shift'),
    alt: mods.has('alt'),
  };
}

export function matchesKeys(e: KeyboardEvent, keys: string[]): boolean {
  return keys.some((k) => {
    const p = parseKeys(k);
    return (
      e.key.toLowerCase() === p.key &&
      e.metaKey === p.meta &&
      e.ctrlKey === p.ctrl &&
      e.shiftKey === p.shift &&
      e.altKey === p.alt
    );
  });
}
