import {
  fetchAllergySeverityConceptUUIDs,
  fetchOtherNonCodedAllergenUUID,
  isNonCodedAllergen,
  OPENMRS_ALLERGEN_TYPE,
  saveAllergy,
  type AllergenType,
  type AllergyInputEntry,
  type SaveAllergyRequest,
} from '@bahmni/services';
import { createAllergiesBundleEntries } from '../../../services/encounterBundleService';
import { useAllergyStore, useEncounterDetailsStore } from '../../../stores';
import { registerInputControl } from '../registry';
import AllergiesForm from './AllergiesForm';

/** Allergies the user actually wants saved (new, or pre-loaded and edited). */
const pendingAllergies = (): AllergyInputEntry[] =>
  useAllergyStore
    .getState()
    .selectedAllergies.filter((a) => a.isModified !== false);

/** Classified entries carry their own answer; unclassified ones need the uuid. */
const isNonCoded = (a: AllergyInputEntry): boolean =>
  a.isNonCoded ?? isNonCodedAllergen(a.id);

/**
 * Only look up the install's Other, Non-Coded uuid when some pending entry
 * hasn't been classified yet, so a coded-only submission never depends on it.
 */
const resolveUuidIfNeeded = async (
  pending: AllergyInputEntry[],
): Promise<void> => {
  if (pending.some((a) => a.isNonCoded === undefined)) {
    await fetchOtherNonCodedAllergenUUID();
  }
};

const toSaveAllergyRequest = async (
  allergy: AllergyInputEntry,
): Promise<SaveAllergyRequest> => ({
  allergen: {
    // The concept keeps whichever category it was picked under — it is a
    // member of the drug, food and environment allergen sets.
    allergenType: OPENMRS_ALLERGEN_TYPE[allergy.type as AllergenType],
    codedAllergen: { uuid: allergy.id },
    nonCodedAllergen: allergy.nonCodedAllergen!.trim(),
  },
  reactions: allergy.selectedReactions
    .filter((reaction) => !!reaction.code)
    .map((reaction) => ({ reaction: { uuid: reaction.code! } })),
  // The REST API needs the severity concept uuid; selectedSeverity.code is the
  // FHIR severity code used by the EncounterBundle path. The concept uuid is
  // configurable per install, so it's resolved from the backend rather than
  // hardcoded.
  severity: allergy.selectedSeverity?.code
    ? {
        uuid: (await fetchAllergySeverityConceptUUIDs())[
          allergy.selectedSeverity.code
        ],
      }
    : null,
  ...(allergy.note?.trim() ? { comment: allergy.note.trim() } : {}),
});

registerInputControl({
  key: 'allergies',
  component: AllergiesForm,
  reset: () => useAllergyStore.getState().reset(),
  validate: () => useAllergyStore.getState().validateAllAllergies(),
  // In edit mode allergies are pre-loaded with isModified:false; Done should stay
  // disabled until the user actually changes something (isModified:true) or adds a
  // new allergy (isModified:undefined, i.e. not explicitly false).
  hasData: () =>
    useAllergyStore
      .getState()
      .selectedAllergies.some((a) => a.isModified !== false),
  subscribe: (cb) => useAllergyStore.subscribe(cb),
  // Without this the consultation pad skips the bundle whenever the allergies
  // control also has a direct submit, losing any coded allergy saved alongside.
  // Awaits the install's actual Other, Non-Coded concept uuid first so this —
  // and the createBundleEntries call consultationPad makes right after —
  // never misclassify an allergy using the hardcoded default. Lets the fetch
  // failure propagate rather than swallowing it: silently falling back here
  // would risk sending a custom-UUID install's non-coded allergy through the
  // bundle path, which can't carry its free-text name — the exact bug class
  // this control exists to prevent.
  hasBundleData: async () => {
    const pending = pendingAllergies();
    await resolveUuidIfNeeded(pending);
    return pending.some((a) => !isNonCoded(a));
  },
  createBundleEntries: (ctx) =>
    createAllergiesBundleEntries({
      selectedAllergies: useAllergyStore.getState().selectedAllergies,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    }),
  // The bundle is one all-or-nothing transaction, so every coded allergy that
  // was pending when it succeeded is now persisted. Mark them unmodified so a
  // retry after a later onDirectSubmit failure doesn't POST them again.
  onSubmitSuccess: () => useAllergyStore.getState().markCodedAllergiesAsSaved(),
  onDirectSubmit: async () => {
    const patientUUID = useEncounterDetailsStore.getState().patientUUID;
    if (!patientUUID) return;

    // Same reasoning as hasBundleData above: a failed lookup must not be
    // swallowed, or a custom-UUID install's non-coded allergy could be left
    // out of this REST loop and silently fall through to the bundle instead.
    const pending = pendingAllergies();
    await resolveUuidIfNeeded(pending);

    for (const allergy of pending.filter(isNonCoded)) {
      // resourceId is the FHIR AllergyIntolerance id, which fhir2 sets from the
      // OpenMRS allergy uuid — so it addresses the same record for an update.
      const response = await saveAllergy(
        patientUUID,
        await toSaveAllergyRequest(allergy),
        allergy.resourceId,
      );

      // Record the backend uuid immediately so that if the encounter bundle
      // that follows fails and the user retries, this allergy is addressed by
      // uuid (an update) instead of being POSTed again as a new record.
      if (!allergy.resourceId && response?.uuid) {
        useAllergyStore
          .getState()
          .setResourceId(allergy.entryId, response.uuid);
      }
    }
  },
});

export { default } from './AllergiesForm';
