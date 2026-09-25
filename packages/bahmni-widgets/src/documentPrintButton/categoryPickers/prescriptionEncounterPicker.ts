import {
  DEFAULT_TIME_FORMAT,
  formatDateTime,
  getPatientEncounters,
  getVisits,
} from '@bahmni/services';
import type { Encounter } from 'fhir/r4';
import type { CategoryPicker } from './types';

const ENCOUNTER_DATE_TIME_FORMAT = `dd-MMM-yyyy ${DEFAULT_TIME_FORMAT}`;
const RECENT_VISITS_COUNT = 2;

// A visit is just an Encounter tagged `_tag=visit`; a child encounter carries
// a `partOf` reference back to it (see standard-config prescriptions/compute.js,
// which relies on this same reference to scope medications to a visit).
interface EncounterListItem extends Encounter {
  visit?: Encounter;
}

function encounterLabel(encounter: Encounter): string {
  return (
    encounter.type?.[0]?.coding?.[0]?.display ??
    encounter.type?.[0]?.text ??
    encounter.class?.display ??
    encounter.id ??
    ''
  );
}

function resolveVisitId(
  encounter: Encounter,
  visitIds: Set<string>,
): string | undefined {
  if (encounter.id && visitIds.has(encounter.id)) return encounter.id;
  return encounter.partOf?.reference?.split('/')[1];
}

export const prescriptionEncounterPicker: CategoryPicker<EncounterListItem> = {
  heading: 'SELECT_ENCOUNTER_FOR_PRESCRIPTION_PRINT',
  emptyStateMessage: 'NO_ENCOUNTERS_FOUND',

  fetchItems: async (context) => {
    const patientUUID = context.patientUUID ?? context.patientUuid;
    if (!patientUUID) return [];

    // Only look back as far as the second-most-recent visit, so printing stays
    // scoped to the last 2 visits instead of a patient's entire encounter history.
    const visits = [
      ...(await getVisits(patientUUID, undefined, RECENT_VISITS_COUNT)),
    ].sort((a, b) =>
      (b.period?.start ?? '').localeCompare(a.period?.start ?? ''),
    );
    const secondMostRecentVisitStart = visits[1]?.period?.start;
    const sinceDate = secondMostRecentVisitStart
      ? new Date(secondMostRecentVisitStart).toISOString()
      : undefined;

    const visitById = new Map<string, Encounter>();
    for (const visit of visits) {
      if (visit.id) visitById.set(visit.id, visit);
    }
    const visitIds = new Set(visitById.keys());

    const encounters = await getPatientEncounters(patientUUID, sinceDate);
    return [...encounters]
      .sort((a, b) =>
        (b.period?.start ?? '').localeCompare(a.period?.start ?? ''),
      )
      .map((encounter) => {
        const visitId = resolveVisitId(encounter, visitIds);
        return {
          ...encounter,
          visit: visitId ? visitById.get(visitId) : undefined,
        };
      });
  },

  getItemKey: (encounter) => encounter.id ?? '',

  renderItem: (encounter, t) => {
    const start = encounter.period?.start;
    const providerName = encounter.participant?.[0]?.individual?.display;
    const dateTime = start
      ? formatDateTime(start, t, true, ENCOUNTER_DATE_TIME_FORMAT)
          .formattedResult
      : '';
    return {
      primary: encounterLabel(encounter),
      secondary: [dateTime, providerName].filter(Boolean).join(' | '),
    };
  },

  resolveSelection: (encounter, context) => {
    const { visit } = encounter;

    const visitContext: Record<string, string> = {};
    if (visit?.id) visitContext.visitUuid = visit.id;
    if (visit?.period?.start) {
      visitContext.visitStartDate = visit.period.start;
      // An in-progress visit has no period.end yet; treat it as covering up to now
      // so a date-range query against it still returns the visit's vitals.
      visitContext.visitEndDate = visit.period.end ?? new Date().toISOString();
    }

    return {
      context: {
        ...context,
        encounterUuid: encounter.id ?? '',
        ...visitContext,
      },
    };
  },
};
