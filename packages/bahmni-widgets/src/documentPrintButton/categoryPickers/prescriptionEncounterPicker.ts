import {
  DEFAULT_TIME_FORMAT,
  formatDateTime,
  getRecentVisitEncounters,
  type EncounterWithVisit,
} from '@bahmni/services';
import type { Encounter } from 'fhir/r4';
import type { CategoryPicker } from './types';

const ENCOUNTER_DATE_TIME_FORMAT = `dd-MMM-yyyy ${DEFAULT_TIME_FORMAT}`;
const RECENT_VISITS_COUNT = 2;

function encounterLabel(encounter: Encounter): string {
  return (
    encounter.type?.[0]?.coding?.[0]?.display ??
    encounter.type?.[0]?.text ??
    encounter.class?.display ??
    encounter.id ??
    ''
  );
}

export const prescriptionEncounterPicker: CategoryPicker<EncounterWithVisit> = {
  heading: 'SELECT_ENCOUNTER_FOR_PRESCRIPTION_PRINT',
  emptyStateMessage: 'NO_ENCOUNTERS_FOUND',

  fetchItems: async (context) => {
    const patientUUID = context.patientUUID ?? context.patientUuid;
    if (!patientUUID) return [];

    return getRecentVisitEncounters(patientUUID, RECENT_VISITS_COUNT);
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
