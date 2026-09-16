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

function encounterLabel(encounter: Encounter): string {
  return (
    encounter.type?.[0]?.coding?.[0]?.display ??
    encounter.type?.[0]?.text ??
    encounter.class?.display ??
    encounter.id ??
    ''
  );
}

export const prescriptionEncounterPicker: CategoryPicker<Encounter> = {
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

    const encounters = await getPatientEncounters(patientUUID, sinceDate);
    return [...encounters].sort((a, b) =>
      (b.period?.start ?? '').localeCompare(a.period?.start ?? ''),
    );
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

  resolveSelection: (encounter, context) => ({
    context: { ...context, encounterUuid: encounter.id ?? '' },
    data: { encounter },
  }),
};
