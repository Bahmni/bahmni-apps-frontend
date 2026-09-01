import { formatDateTime, getPatientEncounters } from '@bahmni/services';
import type { Encounter } from 'fhir/r4';
import type { CategoryPicker, PrintOptionCategory } from './types';

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
  heading: 'SELECT_PRESCRIPTION_TO_PRINT',
  emptyStateMessage: 'NO_ENCOUNTERS_FOUND',

  fetchItems: async (context) => {
    const patientUUID = context.patientUUID ?? context.patientUuid;
    if (!patientUUID) return [];

    const encounters = await getPatientEncounters(patientUUID);
    return [...encounters].sort((a, b) =>
      (b.period?.start ?? '').localeCompare(a.period?.start ?? ''),
    );
  },

  getItemKey: (encounter) => encounter.id ?? '',

  renderItem: (encounter, t) => {
    const start = encounter.period?.start;
    return {
      primary: encounterLabel(encounter),
      secondary: start ? formatDateTime(start, t, true).formattedResult : '',
    };
  },

  resolveSelection: (encounter, context) => ({
    ...context,
    encounterUuid: encounter.id ?? '',
  }),
};

export const categoryPickers: Partial<
  Record<PrintOptionCategory, CategoryPicker<unknown>>
> = {
  PRESCRIPTION: prescriptionEncounterPicker as CategoryPicker<unknown>,
};
