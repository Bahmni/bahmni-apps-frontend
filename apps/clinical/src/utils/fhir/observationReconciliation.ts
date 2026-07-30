import { ComplexValue, Form2Observation } from '@bahmni/services';

/**
 * OpenMRS FHIR2 performs partial updates on PUT: an absent `note` field leaves
 * the existing comment unchanged in the database. The only reliable way to clear
 * a note is to DELETE the existing obs and POST a new one with the same value
 * but no comment. This function finds obs where the note was cleared (original
 * had comment, current does not) and replaces them in-place with the DELETE+POST
 * pair so createObservationEntries emits the correct bundle entries.
 */
export const replaceNoteRemovedObs = (
  transformed: Form2Observation[],
  original: Form2Observation[],
): void => {
  const originalByUuid = new Map<string, Form2Observation>();
  const buildMap = (obs: Form2Observation) => {
    if (obs.uuid) originalByUuid.set(obs.uuid, obs);
    obs.groupMembers?.forEach(buildMap);
  };
  original.forEach(buildMap);

  // Recurse into group members so obsGroup children (e.g. Blood Pressure ->
  // Systolic / Diastolic) are also handled, not just top-level obs. Mirrors
  // replaceInterpretationRemovedObs, which needs the same recursion for the
  // same reason: obsGroup children are each processed as individual leaf
  // Observations in the bundle.
  const processObsList = (obsList: Form2Observation[]): void => {
    for (let i = obsList.length - 1; i >= 0; i--) {
      const obs = obsList[i];
      if (obs.uuid && !obs.voided && !obs.comment) {
        const orig = originalByUuid.get(obs.uuid);
        if (orig?.comment) {
          // DELETE old obs, POST new obs with same value but no note
          obsList.splice(
            i,
            1,
            { ...obs, voided: true },
            { ...obs, uuid: undefined, comment: undefined },
          );
          continue; // spliced entries don't need further recursion
        }
      }
      if (obs.groupMembers?.length) {
        processObsList(obs.groupMembers);
      }
    }
  };

  processObsList(transformed);
};

/**
 * OpenMRS FHIR2 performs partial updates on PUT: an absent `interpretation`
 * element leaves the existing interpretation coding unchanged in the database.
 * The only reliable way to clear an interpretation is to DELETE the existing obs
 * and POST a new one with the same value but no interpretation.  This mirrors
 * replaceNoteRemovedObs which handles the same problem for comments.
 *
 * Applies to both top-level obs AND group members (obsGroup children are each
 * processed as individual leaf Observations in the bundle, so the same
 * partial-update issue affects them — e.g. Blood Pressure → Systolic / Diastolic).
 */
export const replaceInterpretationRemovedObs = (
  transformed: Form2Observation[],
  original: Form2Observation[],
): void => {
  const originalByUuid = new Map<string, Form2Observation>();
  const buildMap = (obs: Form2Observation) => {
    if (obs.uuid) originalByUuid.set(obs.uuid, obs);
    obs.groupMembers?.forEach(buildMap);
  };
  original.forEach(buildMap);

  const processObsList = (obsList: Form2Observation[]): void => {
    for (let i = obsList.length - 1; i >= 0; i--) {
      const obs = obsList[i];
      if (obs.uuid && !obs.voided && !obs.interpretation) {
        const orig = originalByUuid.get(obs.uuid);
        if (orig?.interpretation) {
          // DELETE old obs, POST new obs with same value but no interpretation
          obsList.splice(
            i,
            1,
            { ...obs, voided: true },
            { ...obs, uuid: undefined, interpretation: undefined },
          );
          continue; // spliced entries don't need further recursion
        }
      }
      // Recurse into group members so obsGroup children (e.g. Systolic, Diastolic)
      // are also handled.
      if (obs.groupMembers?.length) {
        processObsList(obs.groupMembers);
      }
    }
  };

  processObsList(transformed);
};

/**
 * When an addMore file-upload item is deleted, form2-controls removes it from
 * the list entirely instead of keeping it as voided. CarbonContainer.getValue()
 * no longer returns it, so the uuid is lost and no DELETE entry is generated.
 *
 * This function diffs `transformed` (what CarbonContainer returned) against
 * `original` (the FHIR-fetched observations in statusSourceRef). Any uuid
 * present in original but absent from transformed is injected as a synthetic
 * voided entry so createObservationEntries emits a DELETE.
 */
export const injectMissingDeleteObs = (
  transformed: Form2Observation[],
  original: Form2Observation[],
): void => {
  const presentUuids = new Set<string>();
  const collectUuids = (obs: Form2Observation) => {
    if (obs.uuid) presentUuids.add(obs.uuid);
    obs.groupMembers?.forEach(collectUuids);
  };
  transformed.forEach(collectUuids);

  const injectInto = (
    originalList: Form2Observation[],
    targetList: Form2Observation[],
  ) => {
    for (const orig of originalList) {
      if (orig.uuid && !presentUuids.has(orig.uuid)) {
        // Obs existed in original but is gone from CarbonContainer output → DELETE
        targetList.push({
          ...orig,
          voided: true,
          value: null,
          groupMembers: undefined,
        });
      }
      if (orig.groupMembers?.length) {
        const matchingGroup = targetList.find((o) => o.uuid === orig.uuid);
        if (matchingGroup) {
          matchingGroup.groupMembers = matchingGroup.groupMembers ?? [];
          injectInto(orig.groupMembers, matchingGroup.groupMembers);
        }
      }
    }
  };

  injectInto(original, transformed);
};

/**
 * CarbonContainer receives Complex observation values as plain string URLs
 * (OBJECT values are stripped in observationsWithValues to avoid the
 * value.indexOf crash). This function restores the original ComplexValue
 * OBJECT (which carries fileName) from the frozen statusSource so that
 * createObservationResource can persist valueAttachment.title to the DB.
 *
 * For newly uploaded files (not in source), the value remains a string and
 * FhirObservationTransformer's FileNameCache handles the title on save.
 */
export const restoreComplexValues = (
  transformed: Form2Observation[],
  source: Form2Observation[],
): void => {
  // Build url → ComplexValue map from source observations
  const urlToComplex = new Map<string, ComplexValue>();
  const buildMap = (obs: Form2Observation) => {
    if (
      typeof obs.value === 'object' &&
      obs.value !== null &&
      'url' in obs.value
    ) {
      urlToComplex.set(
        (obs.value as ComplexValue).url,
        obs.value as ComplexValue,
      );
    }
    obs.groupMembers?.forEach(buildMap);
  };
  source.forEach(buildMap);

  const restore = (obs: Form2Observation) => {
    if (typeof obs.value === 'string' && urlToComplex.has(obs.value)) {
      obs.value = urlToComplex.get(obs.value)!;
    }
    obs.groupMembers?.forEach(restore);
  };
  transformed.forEach(restore);
};

/**
 * CarbonContainer does not pass the `status` field through getValue().
 * This function copies the FHIR status from pre-loaded existingObservations
 * into the transformed observations (matched by uuid) so that PUT requests
 * in the bundle echo back the same status OpenMRS currently has stored.
 * Without it, sending no status causes a null error; sending a different
 * status causes "Editing the fields [status] on Obs is not allowed".
 */
export const mergeObservationStatuses = (
  transformed: Form2Observation[],
  existing: Form2Observation[],
): void => {
  for (const obs of transformed) {
    if (!obs.uuid) continue;
    const match = existing.find((e) => e.uuid === obs.uuid);
    if (match?.status) {
      obs.status = match.status;
    }
    if (obs.groupMembers && match?.groupMembers) {
      mergeObservationStatuses(obs.groupMembers, match.groupMembers);
    }
  }
};

/**
 * Marks leaf observations whose value/comment/interpretation exactly match
 * the original FHIR snapshot as `unchanged`, so the bundle builder
 * (observationResourceCreator) skips emitting a PUT for them. Observations
 * are time-bound clinical facts — a field the user never touched shouldn't be
 * rewritten (new dateChanged, extra DB write) just because it's present in
 * the form alongside a field that actually changed.
 *
 * Recurses into obsGroup children too: unchanged group members are safely
 * omitted from their parent's hasMember list, not just from the PUT. Bahmni's
 * FHIR2 extension (BahmniObsDaoImpl.updateObsMember) applies hasMember as
 * `UPDATE obs SET obs_group_id = :parentId WHERE obs_id IN (:members)` — it
 * only touches the rows explicitly listed, so an omitted-but-still-existing
 * child is never unlinked from its group.
 */
export const markUnchangedObservations = (
  transformed: Form2Observation[],
  original: Form2Observation[],
): void => {
  const originalByUuid = new Map<string, Form2Observation>();
  const buildMap = (obs: Form2Observation) => {
    if (obs.uuid) originalByUuid.set(obs.uuid, obs);
    obs.groupMembers?.forEach(buildMap);
  };
  original.forEach(buildMap);

  const processObsList = (obsList: Form2Observation[]): void => {
    for (const obs of obsList) {
      if (obs.groupMembers?.length) {
        processObsList(obs.groupMembers);
        continue;
      }
      if (!obs.uuid || obs.voided) continue;
      const orig = originalByUuid.get(obs.uuid);
      if (!orig) continue;
      // Interpretation is compared case-insensitively: getValue() echoes back
      // CarbonContainer's internal uppercase codes ("ABNORMAL"), while the
      // frozen FHIR-fetched snapshot holds the raw display string
      // ("Abnormal") — the container normalises the same way on the way IN
      // to CarbonContainer, for the same reason.
      if (
        valueFingerprint(obs.value) === valueFingerprint(orig.value) &&
        obs.comment === orig.comment &&
        (obs.interpretation ?? '').toUpperCase() ===
          (orig.interpretation ?? '').toUpperCase()
      ) {
        obs.unchanged = true;
      }
    }
  };

  processObsList(transformed);
};

/**
 * Converts a single observation value to a stable, comparable string.
 *
 * Handles:
 * - Coded values ({uuid}) — keyed by uuid only, ignoring display/name drift
 * - Complex ({url}) and URL strings — normalised to the URL string
 * - Date objects and ISO date strings — reduced to YYYY-MM-DD (timezone-safe).
 *   The regex match is validated with `new Date()` so numeric-looking strings
 *   like "2024" are never misidentified as dates.
 * - Primitives — String()
 */
export const valueFingerprint = (v: unknown): string => {
  if (v == null) return '';
  // Date: validate the parsed date before treating the string as a date value
  if (v instanceof Date && !Number.isNaN(v.getTime()))
    return `date:${v.toISOString().slice(0, 10)}`;
  if (typeof v === 'string') {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
    if (m && !Number.isNaN(new Date(m[1]).getTime())) return `date:${m[1]}`;
  }
  const obj = typeof v === 'object' ? (v as Record<string, unknown>) : null;
  if (obj && 'uuid' in obj) return `uuid:${obj.uuid}`;
  if (typeof v === 'string' && obj == null) return v; // plain string / URL
  // Normalise Complex { url } to the same fingerprint as a plain URL string so
  // that an obs whose value was { url, fileName } in FHIR (returned as Complex by
  // getValue()) matches the plain URL string produced by extractControls.
  if (obj && 'url' in obj) return String(obj.url);
  return JSON.stringify(v);
};

/**
 * Compares current form observations against the baseline. Returns true when
 * any field was added, removed, or changed.
 *
 * Multiselect fields produce several observations with the same formFieldPath.
 * Collecting into sorted string arrays per path makes the comparison
 * order-independent and avoids Map overwrites that caused the last value to win.
 */
export const detectFormChanges = (
  current: Form2Observation[],
  original: Form2Observation[],
): boolean => {
  // Collect all value fingerprints per formFieldPath into sorted arrays so
  // multiselect entries (same path, different values) are compared as a set.
  const collect = (
    list: Form2Observation[],
    map: Map<string, string[]>,
  ): void => {
    for (const obs of list) {
      if (obs.formFieldPath && obs.value !== null && obs.value !== undefined) {
        const fp = valueFingerprint(obs.value);
        const arr = map.get(obs.formFieldPath) ?? [];
        // Deduplicate: CarbonContainer may still return the same obs via both a
        // parent obsGroup's groupMembers and as a standalone entry.  Without
        // dedup the baseline length is 2 while current is 1, so detectFormChanges
        // always reports "changed" even after the user restores the original value.
        if (!arr.includes(fp)) arr.push(fp);
        map.set(obs.formFieldPath, arr);
      }
      // Track comment (note) changes independently of value changes so that
      // adding or editing a note on an existing obs enables the Done button.
      if (
        obs.formFieldPath &&
        obs.comment !== null &&
        obs.comment !== undefined
      ) {
        const commentKey = `${obs.formFieldPath}__comment`;
        map.set(commentKey, [String(obs.comment)]);
      }
      if (obs.groupMembers) collect(obs.groupMembers, map);
    }
    // Sort each bucket so comparison is order-independent
    for (const arr of map.values()) arr.sort((a, b) => a.localeCompare(b));
  };

  const currentVals = new Map<string, string[]>();
  collect(current, currentVals);
  const originalVals = new Map<string, string[]>();
  collect(original, originalVals);

  // New fields
  for (const path of currentVals.keys()) {
    if (!originalVals.has(path)) return true;
  }
  // Removed fields
  for (const path of originalVals.keys()) {
    if (!currentVals.has(path)) return true;
  }
  // Changed values (including multiselect set differences)
  for (const [path, currArr] of currentVals) {
    const origArr = originalVals.get(path)!;
    if (currArr.length !== origArr.length) return true;
    if (currArr.some((v, i) => v !== origArr[i])) return true;
  }
  return false;
};

/**
 * Extracts the form version string from an observation's formFieldPath.
 * formFieldPath format: "FormName.version/controlId-instance"
 * Returns null when the path is absent or does not contain version info.
 */
export function extractVersionFromFormFieldPath(
  formFieldPath: string | undefined,
): string | null {
  if (!formFieldPath) return null;
  const slashIdx = formFieldPath.indexOf('/');
  if (slashIdx < 0) return null;
  const dotIdx = formFieldPath.lastIndexOf('.', slashIdx);
  if (dotIdx < 0) return null;
  const version = formFieldPath.substring(dotIdx + 1, slashIdx);
  return version || null;
}
