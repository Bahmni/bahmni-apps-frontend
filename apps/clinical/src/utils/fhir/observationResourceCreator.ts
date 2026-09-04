import { getFhirObservations, FhirReference } from '@bahmni/form2-controls';
import { Form2Observation, createBundleEntry } from '@bahmni/services';
import { BundleEntry, Observation, Reference } from 'fhir/r4';

/** Creates FHIR bundle entries for a list of Form2Observations, choosing POST/PUT/DELETE/skip per obs's uuid/voided/unchanged state. */
export function createObservationEntries(
  observations: Form2Observation[],
  subjectReference: Reference,
  encounterReference: Reference,
  performerReference: Reference,
  basedOn?: Reference,
): BundleEntry[] {
  const entries: BundleEntry[] = [];

  const options = {
    patientReference: subjectReference as FhirReference,
    encounterReference: encounterReference as FhirReference,
    performerReference: performerReference as FhirReference,
    basedOnReference: basedOn as FhirReference | undefined,
  };

  const processObservation = (obs: Form2Observation): ChildResult => {
    if (obs.groupMembers && obs.groupMembers.length > 0) {
      return processGroupedObservation(
        obs,
        processObservation,
        entries,
        options,
      );
    }
    return processLeafObservation(obs, entries, options);
  };

  for (const obs of observations) {
    processObservation(obs);
  }

  return entries;
}

type ObsOptions = {
  patientReference: FhirReference;
  encounterReference: FhirReference;
  performerReference: FhirReference;
  basedOnReference?: FhirReference;
};

type ObsEntry = { resource: Observation; fullUrl: string };

/** Outcome of processing one observation, reported to its parent: hasMember ref (if any) and whether it still exists. */
type ChildResult = {
  ref: string | null;
  stillExists: boolean;
};

const NONE: ChildResult = { ref: null, stillExists: false };

/** Processes a grouped observation (obsGroup): collects hasMember refs, then delegates to existing/new-group path. */
function processGroupedObservation(
  obs: Form2Observation,
  processChild: (child: Form2Observation) => ChildResult,
  entries: BundleEntry[],
  options: ObsOptions,
): ChildResult {
  const childResults = obs.groupMembers!.map(processChild);
  const hasMemberRefs = childResults
    .map((r) => r.ref)
    .filter((ref): ref is string => ref !== null);
  const anyStillExists = childResults.some((r) => r.stillExists);
  const anyChangedOrNew = hasMemberRefs.length > 0;

  if (obs.uuid) {
    if (!anyStillExists) {
      const url = `Observation/${obs.uuid}`;
      entries.push(
        createBundleEntry(
          url,
          { resourceType: 'Observation', id: obs.uuid } as Observation,
          'DELETE',
          url,
        ),
      );
      return { ref: null, stillExists: false };
    }
    if (!anyChangedOrNew) {
      // Nothing new/changed to link — skip the parent entirely (a removed child's own DELETE is sufficient).
      return { ref: `Observation/${obs.uuid}`, stillExists: true };
    }
    const url = processExistingGroup(obs, hasMemberRefs, entries, options);
    return url
      ? { ref: url, stillExists: true }
      : { ...NONE, stillExists: true };
  }

  if (!anyStillExists) return NONE;
  const url = postNewGroup(obs, hasMemberRefs, entries, options);
  return url ? { ref: url, stillExists: true } : NONE;
}

/** PUTs an existing obsGroup parent with hasMember set to only its new/changed children. */
function processExistingGroup(
  obs: Form2Observation,
  hasMemberRefs: string[],
  entries: BundleEntry[],
  options: ObsOptions,
): string | null {
  const [parentEntry] = getFhirObservations(
    [{ ...obs, groupMembers: [] }],
    options,
  ) as ObsEntry[];
  if (parentEntry) {
    parentEntry.resource.id = obs.uuid!;
    if (obs.status) {
      parentEntry.resource.status = obs.status as Observation['status'];
    }
    if (obs.basedOn) {
      parentEntry.resource.basedOn = [obs.basedOn];
    }
    parentEntry.resource.hasMember = hasMemberRefs.map((ref) => ({
      reference: ref,
    }));
    const url = `Observation/${obs.uuid}`;
    entries.push(createBundleEntry(url, parentEntry.resource, 'PUT', url));
    return url;
  }
  return null;
}

/** POSTs a brand-new obsGroup (no existing uuid). */
function postNewGroup(
  obs: Form2Observation,
  hasMemberRefs: string[],
  entries: BundleEntry[],
  options: ObsOptions,
): string | null {
  const [parentEntry] = getFhirObservations(
    [{ ...obs, groupMembers: [] }],
    options,
  ) as ObsEntry[];
  if (parentEntry) {
    parentEntry.resource.hasMember = hasMemberRefs.map((ref) => ({
      reference: ref,
    }));
    entries.push(
      createBundleEntry(parentEntry.fullUrl, parentEntry.resource, 'POST'),
    );
    return parentEntry.fullUrl;
  }
  return null;
}

/** Processes a leaf observation: new→POST, unchanged→skip, changed→PUT, voided→DELETE. */
function processLeafObservation(
  obs: Form2Observation,
  entries: BundleEntry[],
  options: ObsOptions,
): ChildResult {
  if (!obs.uuid && !obs.voided) {
    // Skip empty addMore trailing slots — POSTing them errors on Complex-type concepts.
    if (obs.value == null) return NONE;
    const [entry] = getFhirObservations([obs], options) as ObsEntry[];
    if (entry) {
      entries.push(createBundleEntry(entry.fullUrl, entry.resource, 'POST'));
      return { ref: entry.fullUrl, stillExists: true };
    }
    return NONE;
  }
  if (obs.uuid && !obs.voided) {
    if (obs.unchanged) {
      return { ref: null, stillExists: true };
    }
    const url = putExistingLeaf(obs, entries, options);
    return url
      ? { ref: url, stillExists: true }
      : { ...NONE, stillExists: true };
  }
  if (obs.uuid && obs.voided) {
    const url = `Observation/${obs.uuid}`;
    entries.push(
      createBundleEntry(
        url,
        { resourceType: 'Observation', id: obs.uuid } as Observation,
        'DELETE',
        url,
      ),
    );
    return { ref: null, stillExists: false };
  }
  // No uuid + voided = was never saved, skip
  return NONE;
}

/** PUTs an existing leaf observation, echoing back its current FHIR status + basedOn as OpenMRS requires. */
function putExistingLeaf(
  obs: Form2Observation,
  entries: BundleEntry[],
  options: ObsOptions,
): string | null {
  const [entry] = getFhirObservations([obs], options) as ObsEntry[];
  if (entry) {
    entry.resource.id = obs.uuid!;
    if (obs.status) {
      entry.resource.status = obs.status as Observation['status'];
    }
    if (obs.basedOn) {
      entry.resource.basedOn = [obs.basedOn];
    }
    const url = `Observation/${obs.uuid}`;
    entries.push(createBundleEntry(url, entry.resource, 'PUT', url));
    return url;
  }
  return null;
}
