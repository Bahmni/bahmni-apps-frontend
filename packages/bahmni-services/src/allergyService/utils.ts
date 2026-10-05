import type { AllergyIntolerance, Coding } from 'fhir/r4';
import { OTHER_NON_CODED_ALLERGEN_UUID } from './constants';
import type { AllergyInputEntry } from './models';

let resolvedOtherNonCodedAllergenUuid: string = OTHER_NON_CODED_ALLERGEN_UUID;

/**
 * Called by fetchOtherNonCodedAllergenUUID() (allergyService.ts) once it
 * resolves this install's actual `allergy.concept.otherNonCoded` global
 * property, so isNonCodedAllergen() can consult that instead of the
 * hardcoded CIEL default below.
 */
export const setOtherNonCodedAllergenUuid = (uuid: string): void => {
  resolvedOtherNonCodedAllergenUuid = uuid;
};

/**
 * True for the Other, Non-Coded allergen concept. OpenMRS treats an allergy on
 * it as non-coded and requires a free-text allergen name.
 */
export const isNonCodedAllergen = (conceptUuid: string): boolean =>
  conceptUuid === resolvedOtherNonCodedAllergenUuid;

/**
 * Maps a raw FHIR AllergyIntolerance resource to an AllergyInputEntry for the
 * edit form. Callers must await fetchOtherNonCodedAllergenUUID() first so the
 * non-coded classification (and the preserved free-text name) uses the
 * install's actual concept uuid rather than the default.
 */
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
    // fhir.id is always present for a persisted resource; this fallback only
    // guards against a malformed input. Matches the crypto.randomUUID() used
    // for entryId elsewhere (allergyStore.ts's addAllergy).
    entryId: fhir.id ?? crypto.randomUUID(),
    resourceId: fhir.id,
    rawFhirResource: fhir,
    display: fhir.code?.text ?? '',
    isNonCoded: isNonCodedAllergen(allergenCode),
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
