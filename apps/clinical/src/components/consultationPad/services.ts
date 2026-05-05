import type { Bundle, Encounter } from 'fhir/r4';
import {
  createEncounterBundleEntry,
  getEncounterReference,
  postConsultationBundle,
} from '../../services/consultationBundleService';
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

  const formEntries = deps.activeEntries
    .filter((entry) => entry.hasData() && entry.createBundleEntries)
    .flatMap((entry) => entry.createBundleEntries!(ctx));

  const consultationBundle = createConsultationBundle([
    encounterBundleEntry,
    ...formEntries,
  ]);

  const responseBundle =
    await postConsultationBundle<Bundle>(consultationBundle);

  return {
    updatedConcepts: extractConceptsFromResponseBundle(responseBundle),
    patientUUID: patientUUID!,
    encounterTypeName: selectedEncounterType!.name,
  };
}
