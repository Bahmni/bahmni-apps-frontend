import type { AllergyIntolerance, Coding } from 'fhir/r4';

/**
 * Interface representing an allergy input entry for form handling
 */
export interface AllergyInputEntry {
  id: string;
  /** FHIR AllergyIntolerance resource UUID. When set, bundle uses PUT to update the existing resource. */
  resourceId?: string;
  /** True when the user has changed severity, reactions, or note since the allergy was pre-loaded. */
  isModified?: boolean;
  /** Full raw FHIR AllergyIntolerance resource — used as the PUT base to preserve clinicalStatus, verificationStatus, etc. */
  rawFhirResource?: AllergyIntolerance;
  display: string;
  type: string;
  selectedSeverity: Coding | null;
  selectedReactions: Coding[];
  note?: string;
  errors: {
    severity?: string;
    reactions?: string;
  };
  hasBeenValidated: boolean;
}

/** Maps a raw FHIR AllergyIntolerance resource to an AllergyInputEntry for the edit form. */
export function mapAllergyToInputEntry(
  fhir: AllergyIntolerance,
): AllergyInputEntry {
  const allergenCode = fhir.code?.coding?.[0]?.code ?? fhir.id ?? '';
  const severity = fhir.reaction?.[0]?.severity;
  const seen = new Set<string>();
  const selectedReactions: Coding[] = [];
  for (const r of fhir.reaction ?? []) {
    for (const m of r.manifestation ?? []) {
      for (const c of m.coding ?? []) {
        if (!c.system && c.code && !seen.has(c.code)) {
          seen.add(c.code);
          selectedReactions.push(c as Coding);
        }
      }
    }
  }
  return {
    id: allergenCode,
    resourceId: fhir.id,
    rawFhirResource: fhir,
    display: fhir.code?.text ?? '',
    type: fhir.category?.[0] ?? '',
    selectedSeverity: severity
      ? { code: severity, display: `SEVERITY_${severity.toUpperCase()}` }
      : null,
    selectedReactions,
    note: fhir.note?.map((n) => n.text).join('; '),
    errors: {},
    hasBeenValidated: false,
  };
}

export type AllergenType = 'food' | 'medication' | 'environment';

export interface AllergenConcept {
  uuid: string;
  display: string;
  type: AllergenType | null;
  disabled?: boolean;
}
