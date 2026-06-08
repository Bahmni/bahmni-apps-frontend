import type { Bundle, Encounter } from 'fhir/r4';
import {
  createEncounterBundleEntry,
  getEncounterReference,
  postConsultationBundle,
  submitAllergyChanges,
} from '../../services/consultationBundleService';
import { useAllergyStore } from '../../stores/allergyStore';
import { useEncounterDetailsStore } from '../../stores/encounterDetailsStore';
import { extractConceptsFromResponseBundle } from '../../utils/fhir/conceptExtractor';
import { createConsultationBundle } from '../../utils/fhir/consultationBundleCreator';
import { createEncounterResource } from '../../utils/fhir/encounterResourceCreator';
import type { EncounterContext, InputControl } from '../forms';

interface SubmissionRequest {
  activeEncounter: Encounter | null;
  episodeOfCareUuids: string[];
  statDurationInMilliseconds?: number;
  activeEntries: InputControl[];
}

interface SubmissionResult {
  updatedConcepts: Map<string, string>;
  patientUUID: string;
  encounterTypeName: string;
}

export async function submitConsultation(
  deps: SubmissionRequest,
): Promise<SubmissionResult> {
  const {
    selectedEncounterType,
    patientUUID,
    encounterParticipants,
    activeVisit,
    selectedLocation,
    consultationDate,
    practitioner,
  } = useEncounterDetailsStore.getState();

  const encounterResource = createEncounterResource(
    selectedEncounterType!.uuid,
    selectedEncounterType!.name,
    patientUUID,
    encounterParticipants.map((p) => p.uuid),
    activeVisit!.id,
    deps.episodeOfCareUuids,
    selectedLocation!.uuid,
    consultationDate,
  );

  const encounterBundleEntry = createEncounterBundleEntry(
    deps.activeEncounter,
    encounterResource,
  );

  const placeholderReference = encounterBundleEntry.fullUrl;

  const encounterReference = getEncounterReference(
    deps.activeEncounter,
    placeholderReference,
  );

  const ctx: EncounterContext = {
    encounterSubject: encounterResource.subject!,
    encounterReference,
    practitionerUUID: practitioner!.uuid,
    consultationDate,
    statDurationInMilliseconds: deps.statDurationInMilliseconds,
  };

  // New allergies go through the bundle (createBundleEntries filters to !resourceId).
  // Existing modified allergies are handled via standalone calls after the bundle.
  const formEntries = deps.activeEntries
    .filter((entry) => entry.hasData() && entry.createBundleEntries)
    .flatMap((entry) => entry.createBundleEntries!(ctx));

  const consultationBundle = createConsultationBundle([
    encounterBundleEntry,
    ...formEntries,
  ]);

  const responseBundle =
    await postConsultationBundle<Bundle>(consultationBundle);

  // Derive the resolved encounter reference for standalone allergy calls.
  // For a new encounter (placeholder), extract its UUID from the bundle response.
  // For an existing encounter, encounterReference already has the Encounter/uuid format.
  const resolvedEncounterReference = resolveEncounterReferenceFromResponse(
    responseBundle,
    encounterReference,
  );

  // Submit allergy changes via standalone FHIR endpoints.
  const allergiesEntry = deps.activeEntries.find((e) => e.key === 'allergies');
  if (allergiesEntry?.hasData()) {
    await submitAllergyChanges({
      selectedAllergies: useAllergyStore.getState().selectedAllergies,
      encounterReference: resolvedEncounterReference,
      encounterSubject: ctx.encounterSubject,
      practitionerUUID: ctx.practitionerUUID,
    });
  }

  return {
    updatedConcepts: extractConceptsFromResponseBundle(responseBundle),
    patientUUID: patientUUID!,
    encounterTypeName: selectedEncounterType!.name,
  };
}

/**
 * Finds the encounter in the bundle response and returns its reference in
 * 'Encounter/uuid' format. Falls back to the original encounterReference
 * (already in the right format) if the encounter cannot be located.
 */
function resolveEncounterReferenceFromResponse(
  responseBundle: Bundle,
  fallback: string,
): string {
  const encounterEntry = responseBundle.entry?.find(
    (e) => e.resource?.resourceType === 'Encounter',
  );
  const encounterId = encounterEntry?.resource?.id;
  return encounterId ? `Encounter/${encounterId}` : fallback;
}
