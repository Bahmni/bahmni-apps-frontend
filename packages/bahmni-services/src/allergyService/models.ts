import type { AllergyIntolerance, Coding } from 'fhir/r4';
import { OTHER_NON_CODED_ALLERGEN_UUID } from './constants';

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
  /**
   * Allergen *concept* identity. Not unique per record: every non-coded
   * ("Other") allergy shares the same Other, Non-Coded concept uuid, so this
   * must never be used as a React/store key — use `entryId` instead.
   */
  id: string;
  /**
   * Unique per-record identity: the FHIR AllergyIntolerance resource UUID for
   * an existing allergy, or a generated client-side id for a new, unsaved one.
   * Store operations (update/remove) and list keys must key off this, not `id`.
   */
  entryId: string;
  /** FHIR AllergyIntolerance resource UUID. When set, bundle uses PUT to update the existing resource. */
  resourceId?: string;
  /** True when the user has changed severity, reactions, or note since the allergy was pre-loaded. */
  isModified?: boolean;
  /** Full raw FHIR AllergyIntolerance resource — used as the PUT base to preserve clinicalStatus, verificationStatus, etc. */
  rawFhirResource?: AllergyIntolerance;
  display: string;
  type: string;
  /** Free-text allergen name, captured only for the Other, Non-Coded concept. */
  nonCodedAllergen?: string;
  selectedSeverity: Coding | null;
  selectedReactions: Coding[];
  note?: string;
  errors: {
    severity?: string;
    reactions?: string;
    nonCodedAllergen?: string;
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
    // fhir.id is always present for a persisted resource; the fallback only
    // guards against a malformed input, so it doesn't need to be a real UUID.
    entryId:
      fhir.id ?? `${allergenCode}-${Math.random().toString(36).slice(2)}`,
    resourceId: fhir.id,
    rawFhirResource: fhir,
    display: fhir.code?.text ?? '',
    // fhir2 puts the free-text allergen name in code.text for a non-coded
    // allergy, so it round-trips back into the edit form.
    ...(isNonCodedAllergen(allergenCode)
      ? { nonCodedAllergen: fhir.code?.text ?? '' }
      : {}),
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

/**
 * True for the Other, Non-Coded allergen concept. OpenMRS treats an allergy on
 * it as non-coded and requires a free-text allergen name.
 */
export const isNonCodedAllergen = (conceptUuid: string): boolean =>
  conceptUuid === OTHER_NON_CODED_ALLERGEN_UUID;

/** OpenMRS AllergenType enum values, as accepted by the REST allergy API. */
export const OPENMRS_ALLERGEN_TYPE: Record<AllergenType, string> = {
  medication: 'DRUG',
  food: 'FOOD',
  environment: 'ENVIRONMENT',
};

/** Request body for POST /openmrs/ws/rest/v1/patient/{patientUuid}/allergy */
export interface SaveAllergyRequest {
  allergen: {
    allergenType: string;
    codedAllergen: { uuid: string };
    /** Required by OpenMRS when codedAllergen is Other, Non-Coded. */
    nonCodedAllergen?: string;
  };
  reactions: { reaction: { uuid: string } }[];
  /** OpenMRS severity *concept* UUID — not the FHIR severity code. */
  severity: { uuid: string } | null;
  comment?: string;
}

/** Response body from the OpenMRS REST allergy API — same shape for create and update. */
export interface SaveAllergyResponse {
  uuid: string;
}

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
