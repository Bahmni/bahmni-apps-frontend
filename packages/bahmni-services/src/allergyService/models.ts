import type { AllergyIntolerance, Coding } from 'fhir/r4';

export enum AllergyStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum AllergySeverity {
  mild = 'mild',
  moderate = 'moderate',
  severe = 'severe',
}

/**
 * Interface representing a formatted allergy for easier consumption by components
 */
//TODO: Move to Bahmni Widgets
export interface FormattedAllergy {
  readonly id: string;
  /** FHIR AllergyIntolerance resource UUID — required for PUT (edit existing allergy). */
  readonly resourceId?: string;
  readonly display: string;
  readonly category?: ReadonlyArray<string>;
  readonly criticality?: string;
  readonly status: AllergyStatus;
  readonly recordedDate: string;
  readonly recorder?: string;
  readonly reactions?: ReadonlyArray<{
    readonly manifestation: string[];
    /** FHIR Codings for each manifestation — needed to rebuild selectedReactions on edit. */
    readonly manifestationCodings?: ReadonlyArray<Coding>;
    readonly severity?: AllergySeverity;
  }>;
  readonly severity?: AllergySeverity;
  readonly note?: string;
}

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
  type: AllergenType;
  disabled?: boolean;
}

export interface AllergenConceptResponse {
  uuid: string;
  setMembers: {
    uuid: string;
    display: string;
    retired: boolean;
  }[];
}
