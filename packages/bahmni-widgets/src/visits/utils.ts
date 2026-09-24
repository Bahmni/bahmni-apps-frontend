import { camelToScreamingSnakeCase, formatDateTime } from '@bahmni/services';
import { isSameDay } from 'date-fns';
import { Encounter } from 'fhir/r4';
import { DEFAULT_MAXIMUM_NO_OF_VISITS } from './constants';
import { VisitViewModel } from './model';

/**
 * Maps each visit UUID to the login location its clinical work was recorded at.
 *
 * A visit's own `location` is the OpenMRS **Visit Location** (the facility, e.g.
 * "Bahmni Hospital") — never the location chosen at login. The login location is
 * carried by the visit's **child encounters**, which reference their parent via
 * `partOf` (`Encounter/<visitUuid>`). So the per-visit login location has to be
 * derived from those children rather than read off the visit.
 *
 * Child encounters are visited in the order supplied; `getPatientEncounters()`
 * returns them sorted by `-_lastUpdated`, so the first hit per visit is its most
 * recently updated encounter. Later hits are ignored rather than overwriting, to
 * keep that "most recent wins" behaviour independent of Map insertion order.
 *
 * @param encounters - All encounters for the patient (visits and their children)
 * @returns Map of visit UUID to login location display name
 */
export function buildVisitLocationMap(
  encounters: Encounter[],
): Map<string, string> {
  const locationByVisitId = new Map<string, string>();

  encounters.forEach((encounter) => {
    const visitId = encounter.partOf?.reference?.split('/')[1];
    const location = encounter.location?.[0]?.location?.display;
    if (visitId && location && !locationByVisitId.has(visitId)) {
      locationByVisitId.set(visitId, location);
    }
  });

  return locationByVisitId;
}

/**
 * Maps FHIR visit Encounters to a flat view model, sorted by `period.start`
 * descending (most recent first) and capped to `maximumNoOfVisits`.
 *
 * `getVisits()` queries the FHIR server with `_sort=-_lastUpdated`, which is
 * not the same as "most recent visits" (AC 6/7), so the ordering below must
 * be applied client-side rather than relied upon from the server response.
 *
 * `location` is resolved from `locationByVisitId` (see `buildVisitLocationMap`)
 * and is deliberately left null when the visit has no child encounter yet — the
 * visit's own location would be the facility, not the login location, so falling
 * back to it would reintroduce the wrong value.
 */
export function toVisitViewModels(
  encounters: Encounter[],
  maximumNoOfVisits: number = DEFAULT_MAXIMUM_NO_OF_VISITS,
  locationByVisitId?: Map<string, string>,
): VisitViewModel[] {
  return encounters
    .filter(
      (encounter): encounter is Encounter & { id: string } =>
        !!encounter.id && !!encounter.period?.start,
    )
    .map((encounter) => ({
      id: encounter.id,
      startDate: encounter.period!.start!,
      endDate: encounter.period?.end ?? null,
      isActive: !encounter.period?.end,
      visitType: encounter.type?.[0]?.coding?.[0]?.display ?? '',
      location: locationByVisitId?.get(encounter.id) ?? null,
    }))
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )
    .slice(0, maximumNoOfVisits);
}

/**
 * Formats a visit's date/time for display:
 * - Active visits (no end date): start date + time (per design, the active
 *   visit is the only row that shows a time).
 * - Completed, same-day visits: start date only (AC 3).
 * - Completed, multi-day visits: "<start> to <end>" via the translatable
 *   VISIT_DATE_RANGE key (AC 4).
 */
export function formatVisitDateRange(
  visit: VisitViewModel,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (visit.isActive || !visit.endDate) {
    return formatDateTime(visit.startDate, t, true).formattedResult;
  }

  const start = formatDateTime(visit.startDate, t).formattedResult;
  if (isSameDay(visit.startDate, visit.endDate)) {
    return start;
  }

  const end = formatDateTime(visit.endDate, t).formattedResult;
  return t('VISIT_DATE_RANGE', { start, end });
}

/**
 * Translates a visit-type display name using the VISIT_TYPE_<SCREAMING_SNAKE>
 * convention, falling back to the raw OpenMRS display name (AC 12).
 */
export function translateVisitType(
  visitType: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!visitType) return visitType;
  return t(`VISIT_TYPE_${camelToScreamingSnakeCase(visitType)}`, {
    defaultValue: visitType,
  });
}

/**
 * Whether a visit counts as an IPD visit for the purpose of showing the
 * "View IPD Dashboard" link (AC 9/10), matched case-insensitively against
 * config.ipdVisitTypes.
 */
export function isIpdVisit(
  visitType: string,
  ipdVisitTypes: string[],
): boolean {
  return ipdVisitTypes.some(
    (type) => type.toLowerCase() === visitType.toLowerCase(),
  );
}
