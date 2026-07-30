import { getFhirObservations, FhirReference } from '@bahmni/form2-controls';
import { Form2Observation, createBundleEntry } from '@bahmni/services';
import { BundleEntry, Observation, Reference } from 'fhir/r4';

/**
 * Creates FHIR bundle entries for a list of Form2Observations, using the
 * correct HTTP verb for each observation based on its uuid and voided state:
 *
 *   uuid present + voided:true          → DELETE  Observation/{uuid}
 *   uuid present + obs.unchanged:true   → skipped (no bundle entry emitted)
 *   uuid present + value/comment/       → PUT     Observation/{uuid}
 *     interpretation changed
 *   no uuid + has value                 → POST    urn:uuid:{newUUID}
 *   no uuid + voided (never saved)      → skipped
 *
 * For grouped observations (groupMembers):
 *   - Children are processed first with the rules above.
 *   - If the parent has a uuid and every child is gone (voided/never existed)
 *     → parent is also DELETE.
 *   - If the parent has a uuid and there's no new/changed child to link →
 *     the parent itself is skipped entirely, no bundle entry for it at all.
 *     This covers both "nothing in the group changed" AND "the only change
 *     was a removal" — group membership lives on the CHILD's obs_group_id,
 *     not as a list owned by the parent, so a removed child's own DELETE
 *     entry is sufficient on its own; touching the parent isn't needed and
 *     risks sending an empty hasMember, which OpenMRS's ObsValidator rejects
 *     as "error.noValue" for a group obs with neither a value nor members.
 *   - If the parent has a uuid and at least one child is new/changed → parent
 *     is PUT at Observation/{uuid} (the backend's applyUpdate override reuses
 *     the existing parent and re-links members via updateObsMember, the same
 *     safe mechanism create()'s POST-with-id path already used). `hasMember`
 *     includes ONLY the new/changed children — unchanged children are safely
 *     omitted (see below) and voided children are naturally excluded.
 *   - If the parent has no uuid → parent is POST as a new group.
 *
 * `obs.unchanged` is set upstream (ObservationFormsContainer, which has both
 * the current and original snapshot in scope) for obs whose value/comment/
 * interpretation exactly match what's already saved. Observations are
 * time-bound clinical facts — fields the user didn't touch shouldn't be
 * rewritten (new dateChanged, extra DB churn) just because they happen to be
 * present in the form.
 *
 * Omitting an unchanged group member from `hasMember` is safe: Bahmni's FHIR2
 * extension module (BahmniObsDaoImpl.updateObsMember) applies the incoming
 * hasMember list as `UPDATE obs SET obs_group_id = :parentId WHERE obs_id IN
 * (:members)` — it only touches rows explicitly listed, never clears
 * obs_group_id for rows that are omitted. So an omitted-but-still-existing
 * child stays linked to its group; it is never orphaned by leaving it out.
 */
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

/**
 * Outcome of processing one observation (leaf or group), reported to its
 * parent (if any):
 *   ref        — reference to use in a parent's hasMember; null when this obs
 *                doesn't need a hasMember entry (unchanged/removed/never existed).
 *   stillExists — false only when this obs is gone (voided, or never had a
 *                value to begin with). Used to decide whether a parent group
 *                is now completely empty and should itself be DELETEd. A
 *                removed-but-not-all-gone member never needs the parent
 *                touched at all — group membership lives on the CHILD's
 *                obs_group_id, not as a list owned by the parent, so the
 *                child's own DELETE entry is sufficient on its own.
 */
type ChildResult = {
  ref: string | null;
  stillExists: boolean;
};

const NONE: ChildResult = { ref: null, stillExists: false };

/**
 * Processes a grouped observation (obsGroup): collects hasMember refs for all
 * children, then delegates to the existing-group or new-group path.
 */
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
      // Nothing new/changed to link into the parent — either nothing in the
      // group changed at all, or the only change was a removal. Either way
      // the parent itself needs no update: group membership lives on the
      // CHILD's obs_group_id, not as a list owned by the parent, so a
      // removed child's own DELETE entry is fully sufficient on its own.
      // Sending the parent here would risk an empty hasMember PUT, which
      // OpenMRS's ObsValidator rejects as "error.noValue" for a group obs
      // that (from that single request's perspective) has neither a value
      // nor any members.
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

/**
 * Handles an obsGroup that already exists in the DB (has a uuid) and has at
 * least one new/changed/removed member — PUTs the parent at its existing uuid
 * so OpenMRS updates the obsGroup in place, with hasMember containing only the
 * new/changed children (unchanged children are safely omitted).
 *
 * Uses a real PUT rather than POST-with-id: BahmniFhirObservationServiceImpl's
 * `applyUpdate` override (backend, bahmni-module-fhir2-addl-extension) now
 * handles a PUT-to-existing-obsGroup the same safe way `create()` already
 * handled POST-with-id — reusing the existing parent and re-linking members
 * via `updateObsMember` — so PUT is the correct verb to use here.
 */
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

/**
 * Processes a leaf (non-grouped) observation.
 * New obs → POST. Existing, unchanged → skipped entirely (no ref, no entry).
 * Existing, changed → PUT. Existing, voided → DELETE. Never saved + voided → skipped.
 */
function processLeafObservation(
  obs: Form2Observation,
  entries: BundleEntry[],
  options: ObsOptions,
): ChildResult {
  if (!obs.uuid && !obs.voided) {
    // Skip observations with no value — these are empty addMore trailing slots
    // that CarbonContainer includes in getValue(). POSTing them triggers a
    // ConceptComplex cast error on the backend for Complex-type concepts.
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

/**
 * PUTs an existing leaf observation with its updated value.
 * `obs.status` carries the current FHIR status from the DB ("final" on a
 * first edit, "amended" on subsequent edits) — OpenMRS requires this field
 * to be present on PUT and rejects any value different from what it stores.
 */
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
    const url = `Observation/${obs.uuid}`;
    entries.push(createBundleEntry(url, entry.resource, 'PUT', url));
    return url;
  }
  return null;
}
