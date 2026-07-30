import { ComplexValue, Form2Observation } from '@bahmni/services';

/** Clears a note via DELETE+POST — OpenMRS FHIR2's PUT can't null out an absent field. */
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

  // Recurse into group members too — obsGroup children are processed as individual leaf Observations.
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

/** Clears an interpretation via DELETE+POST, same reason/pattern as replaceNoteRemovedObs. */
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
      // Recurse into group members too.
      if (obs.groupMembers?.length) {
        processObsList(obs.groupMembers);
      }
    }
  };

  processObsList(transformed);
};

/** Injects a synthetic voided DELETE entry for any obs present in `original` but missing from `transformed`. */
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

/** Restores the original ComplexValue object (with fileName) from `source` for values CarbonContainer flattened to plain URL strings. */
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

/** Copies FHIR status (uuid-matched) from `existing` onto `transformed` — CarbonContainer's getValue() drops it, but PUT requires it. */
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

/** Marks leaf observations matching the original snapshot as `unchanged`, so the bundle builder skips PUT-ing them. */
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
      // Interpretation compared case-insensitively (getValue() echoes uppercase codes; snapshot holds display strings).
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

/** Converts a single observation value to a stable, comparable string (coded/complex/date-aware). */
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
  // Normalise Complex { url } to the same fingerprint as a plain URL string.
  if (obj && 'url' in obj) return String(obj.url);
  return JSON.stringify(v);
};

/** Compares current form observations against the baseline; true if any field was added, removed, or changed. */
export const detectFormChanges = (
  current: Form2Observation[],
  original: Form2Observation[],
): boolean => {
  // Collect value fingerprints per formFieldPath into sorted arrays so multiselect entries compare as a set.
  const collect = (
    list: Form2Observation[],
    map: Map<string, string[]>,
  ): void => {
    for (const obs of list) {
      if (obs.formFieldPath && obs.value !== null && obs.value !== undefined) {
        const fp = valueFingerprint(obs.value);
        const arr = map.get(obs.formFieldPath) ?? [];
        // Deduplicate: CarbonContainer may return the same obs both standalone and inside a parent's groupMembers.
        if (!arr.includes(fp)) arr.push(fp);
        map.set(obs.formFieldPath, arr);
      }
      // Track comment (note) changes independently of value changes.
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

/** Extracts the form version from a formFieldPath ("FormName.version/controlId-instance"). */
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
