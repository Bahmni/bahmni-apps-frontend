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
      // ── Grouped observation ──────────────────────────────────────────────
      const hasMemberRefs: string[] = [];

      for (const child of obs.groupMembers) {
        const ref = processObservation(child);
        if (ref) hasMemberRefs.push(ref);
      }

      const allChildrenDeleted = hasMemberRefs.length === 0;

      if (obs.uuid) {
        if (allChildrenDeleted) {
          // DELETE parent when every child was removed
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
        // POST parent with the existing uuid in resource.id so OpenMRS
        // recognises and updates the existing obsGroup in place (no new DB entry).
        // Children that were edited are voided server-side; new child entries are
        // created and linked to the parent via the hasMember list.
        const [parentEntry] = getFhirObservations(
          [{ ...obs, groupMembers: [] }],
          options,
        ) as Array<{
          resource: Observation;
          fullUrl: string;
        }>;
        if (parentEntry) {
          parentEntry.resource.id = obs.uuid;
          // Use the preserved status (required by OpenMRS even on POST-with-uuid;
          // must match what is currently stored — "final" or "amended").
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

      if (allChildrenDeleted) return null;

      // POST new parent group
      const [parentEntry] = getFhirObservations(
        [{ ...obs, groupMembers: [] }],
        options,
      ) as Array<{
        resource: Observation;
        fullUrl: string;
      }>;
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

    // ── Leaf observation ─────────────────────────────────────────────────────
    if (!obs.uuid && !obs.voided) {
      // Skip observations with no value — these are empty addMore trailing slots
      // that CarbonContainer includes in getValue(). POSTing them triggers a
      // ConceptComplex cast error on the backend for Complex-type concepts.
      if (obs.value === null || obs.value === undefined) return null;

      // POST new observation
      const [entry] = getFhirObservations([obs], options) as Array<{
        resource: Observation;
        fullUrl: string;
      }>;
      if (entry) {
        entries.push(createBundleEntry(entry.fullUrl, entry.resource, 'POST'));
        return entry.fullUrl;
      }
      return null;
    }

    if (obs.uuid && !obs.voided) {
      // PUT existing observation with updated value.
      // `obs.status` carries the current FHIR status from the DB ("final" on a
      // first edit, "amended" on subsequent edits) — OpenMRS requires this field
      // to be present on PUT and rejects any value different from what it stores.
      const [entry] = getFhirObservations([obs], options) as Array<{
        resource: Observation;
        fullUrl: string;
      }>;
      if (entry) {
        entry.resource.id = obs.uuid;
        if (obs.status) {
          entry.resource.status = obs.status as Observation['status'];
        }
        const url = `Observation/${obs.uuid}`;
        entries.push(createBundleEntry(url, entry.resource, 'PUT', url));
        return url;
      }
      return null;
    }

    if (obs.uuid && obs.voided) {
      // DELETE existing observation whose value was cleared
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
  };

  for (const obs of observations) {
    processObservation(obs);
  }

  return entries;
}
