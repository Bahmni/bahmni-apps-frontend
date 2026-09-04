import { ComplexValue, Form2Observation } from '@bahmni/services';
import type { Reference } from 'fhir/r4';

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

/** Copies server-echo fields (status, basedOn) uuid-matched from `existing` onto `transformed`.
 *  CarbonContainer's getValue() drops both; PUT must echo them back or OpenMRS rejects the
 *  status field / silently strips the ServiceRequest linkage. */
export const mergeObservationMetadata = (
  transformed: Form2Observation[],
  existing: Form2Observation[],
): void => {
  for (const obs of transformed) {
    if (!obs.uuid) continue;
    const match = existing.find((e) => e.uuid === obs.uuid);
    if (match?.status) obs.status = match.status;
    if (match?.basedOn) obs.basedOn = match.basedOn;
    if (obs.groupMembers && match?.groupMembers) {
      mergeObservationMetadata(obs.groupMembers, match.groupMembers);
    }
  }
};

/** Walks the observations tree (including groupMembers) and returns the first `basedOn`
 *  reference found. Used to derive a form-level ServiceRequest linkage for NEW obs POSTed
 *  during an edit, when the dispatch context has no `task` (e.g. FormsTable edit path).
 *  Observations in a single form submission all share the same basedOn by construction. */
export const findBasedOnFromObservations = (
  observations: Form2Observation[] | undefined,
): Reference | undefined => {
  if (!observations) return undefined;
  for (const obs of observations) {
    if (obs.basedOn) return obs.basedOn;
    if (obs.groupMembers) {
      const found = findBasedOnFromObservations(obs.groupMembers);
      if (found) return found;
    }
  }
  return undefined;
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
      // Date-only concepts have no meaningful time-of-day; strip it before fingerprinting so
      // an untouched field doesn't look "changed" purely from UTC-vs-local formatting drift.
      const dateOnly = obs.concept?.datatype === 'Date';
      const fingerprint = (v: unknown) =>
        dateOnly ? valueFingerprint(v).split(' ')[0] : valueFingerprint(v);
      // Interpretation compared case-insensitively (getValue() echoes uppercase codes; snapshot holds display strings).
      if (
        fingerprint(obs.value) === fingerprint(orig.value) &&
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
  // Date: validate the parsed date before treating the string as a date value.
  // Keep the time-of-day here — truncating unconditionally would hide a time-only edit
  // on a Datetime field; date-only concepts are truncated by the caller instead.
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `date:${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())} ${pad(v.getHours())}:${pad(v.getMinutes())}`;
  }
  if (typeof v === 'string') {
    const m = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(v);
    if (m && !Number.isNaN(new Date(m[1]).getTime())) {
      return m[2] !== undefined
        ? `date:${m[1]} ${m[2]}:${m[3]}`
        : `date:${m[1]}`;
    }
  }
  const obj = typeof v === 'object' ? (v as Record<string, unknown>) : null;
  if (obj && 'uuid' in obj) return `uuid:${obj.uuid}`;
  if (typeof v === 'string' && obj == null) return v; // plain string / URL
  // Normalise Complex { url } to the same fingerprint as a plain URL string.
  if (obj && 'url' in obj) return String(obj.url);
  return JSON.stringify(v);
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
