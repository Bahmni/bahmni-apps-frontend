import { getFhirObservations, FhirReference } from '@bahmni/form2-controls';
import { Form2Observation, createBundleEntry } from '@bahmni/services';
import { BundleEntry, Observation, Reference } from 'fhir/r4';

/**
 * Creates FHIR bundle entries for a list of Form2Observations, using the
 * correct HTTP verb for each observation based on its uuid and voided state:
 *
 *   uuid present + voided:true          → DELETE  Observation/{uuid}
 *   uuid present + has value            → PUT     Observation/{uuid}
 *   no uuid + has value                 → POST    urn:uuid:{newUUID}
 *   no uuid + voided (never saved)      → skipped
 *
 * For grouped observations (groupMembers):
 *   - Children are processed first with the rules above.
 *   - If the parent has a uuid and ALL children are deleted → parent is also DELETE.
 *   - If the parent has a uuid and some children remain     → parent is POST with
 *     resource.id set to the existing uuid.  OpenMRS recognises the id and updates
 *     the obsGroup in place; new child entries are linked via hasMember.
 *   - If the parent has no uuid                             → parent is POST.
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

  const processObservation = (obs: Form2Observation): string | null => {
    // Returns the fullUrl/reference to use in a parent's hasMember (null = deleted).
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
 * Processes a grouped observation (obsGroup): collects hasMember refs for all
 * children, then delegates to the existing-group or new-group path.
 */
function processGroupedObservation(
  obs: Form2Observation,
  processChild: (child: Form2Observation) => string | null,
  entries: BundleEntry[],
  options: ObsOptions,
): string | null {
  const hasMemberRefs: string[] = [];
  for (const child of obs.groupMembers!) {
    const ref = processChild(child);
    if (ref) hasMemberRefs.push(ref);
  }
  const allChildrenDeleted = hasMemberRefs.length === 0;
  if (obs.uuid) {
    return processExistingGroup(
      obs,
      allChildrenDeleted,
      hasMemberRefs,
      entries,
      options,
    );
  }
  if (allChildrenDeleted) return null;
  return postNewGroup(obs, hasMemberRefs, entries, options);
}

/**
 * Handles an obsGroup that already exists in the DB (has a uuid).
 * All children deleted → DELETE the parent.
 * Some children remain → POST parent with uuid so OpenMRS updates in place.
 */
function processExistingGroup(
  obs: Form2Observation,
  allChildrenDeleted: boolean,
  hasMemberRefs: string[],
  entries: BundleEntry[],
  options: ObsOptions,
): string | null {
  if (allChildrenDeleted) {
    const url = `Observation/${obs.uuid}`;
    entries.push(
      createBundleEntry(
        url,
        { resourceType: 'Observation', id: obs.uuid } as Observation,
        'DELETE',
        url,
      ),
    );
    return null;
  }
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
    entries.push(createBundleEntry(url, parentEntry.resource, 'POST'));
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
 * New obs → POST. Existing, not voided → PUT. Existing, voided → DELETE.
 * Never saved + voided → skipped.
 */
function processLeafObservation(
  obs: Form2Observation,
  entries: BundleEntry[],
  options: ObsOptions,
): string | null {
  if (!obs.uuid && !obs.voided) {
    // Skip observations with no value — these are empty addMore trailing slots
    // that CarbonContainer includes in getValue(). POSTing them triggers a
    // ConceptComplex cast error on the backend for Complex-type concepts.
    if (obs.value == null) return null;
    const [entry] = getFhirObservations([obs], options) as ObsEntry[];
    if (entry) {
      entries.push(createBundleEntry(entry.fullUrl, entry.resource, 'POST'));
      return entry.fullUrl;
    }
    return null;
  }
  if (obs.uuid && !obs.voided) {
    return putExistingLeaf(obs, entries, options);
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
    return null;
  }
  // No uuid + voided = was never saved, skip
  return null;
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
