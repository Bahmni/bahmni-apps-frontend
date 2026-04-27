import { formatDateTime } from '@bahmni/services';
import { Observation, Bundle, Encounter } from 'fhir/r4';
import { extractId, extractObservationValue } from '../utils/Observations';
import {
  EncounterDetails,
  ExtractedObservation,
  ExtractedObservationsResult,
  ObservationsByEncounter,
} from './models';

export const formatEncounterTitle = (
  encounterDetails: EncounterDetails | undefined,
  t: (key: string) => string,
): string => {
  if (!encounterDetails?.date) {
    return t('DATE_ERROR_PARSE');
  }
  const result = formatDateTime(encounterDetails.date, t);
  return result.formattedResult;
};

export const formatObservationValue = (
  observation: ExtractedObservation,
  t?: (key: string) => string,
): string => {
  if (!observation.observationValue?.value) {
    return '';
  }
  const { value, unit, type } = observation.observationValue;

  if (type === 'dateTime') {
    return formatDateTime(String(value), t).formattedResult;
  }

  const baseValue = unit ? `${value} ${unit}` : String(value);
  return baseValue;
};

const formatObservationHeader = (observation: ExtractedObservation): string => {
  const display = observation.display!;

  if (!observation.observationValue) {
    return String(display);
  }

  const { unit, referenceRange } = observation.observationValue;

  if (!referenceRange) {
    return String(display);
  }

  const { low, high } = referenceRange;

  if (low && high) {
    const lowStr = low.unit
      ? `${low.value} ${low.unit}`
      : unit
        ? `${low.value} ${unit}`
        : String(low.value);
    const highStr = high.unit
      ? `${high.value} ${high.unit}`
      : unit
        ? `${high.value} ${unit}`
        : String(high.value);
    return `${display} (${lowStr} - ${highStr})`;
  }

  if (low) {
    const lowStr = low.unit
      ? `${low.value} ${low.unit}`
      : unit
        ? `${low.value} ${unit}`
        : String(low.value);
    return `${display} (>${lowStr})`;
  }

  if (high) {
    const highStr = high.unit
      ? `${high.value} ${high.unit}`
      : unit
        ? `${high.value} ${unit}`
        : String(high.value);
    return `${display} (<${highStr})`;
  }

  return display;
};

export const transformObservationToRowCell = (
  observation: ExtractedObservation,
  index: number,
  t?: (key: string) => string,
) => {
  return {
    index,
    header: formatObservationHeader(observation),
    value: formatObservationValue(observation, t),
    provider: observation.encounter?.provider,
  };
};

function extractEncounterDetails(
  encounterId: string,
  encountersMap: Map<string, Encounter>,
): EncounterDetails | undefined {
  const encounter = encountersMap.get(encounterId);
  if (!encounter) return undefined;

  return {
    id: encounter.id ?? encounterId,
    type: encounter.type?.[0]?.coding?.[0]?.display ?? 'Unknown',
    date: encounter.period?.start ?? '',
    provider: encounter.participant?.[0]?.individual?.display,
    location: encounter.location?.[0]?.location?.display,
  };
}

function extractSingleObservation(
  observation: Observation,
  encountersMap: Map<string, Encounter>,
  observationsMap: Map<string, Observation>,
): ExtractedObservation {
  const encounterId = extractId(observation.encounter);
  const members = (observation.hasMember ?? [])
    .map((ref) => extractId(ref))
    .map((id) => (id ? observationsMap.get(id) : undefined))
    .filter((obs): obs is Observation => !!obs)
    .map((obs) =>
      extractSingleObservation(obs, encountersMap, observationsMap),
    );

  const sortId =
    observation.extension
      ?.find(({ url }) => url.includes('form-namespace-path'))
      ?.valueString?.split('/')[1] ?? '';

  return {
    id: observation.id!,
    display:
      observation.code?.text ?? observation.code?.coding?.[0]?.display ?? '',
    observationValue: extractObservationValue(observation),
    effectiveDateTime: observation.effectiveDateTime,
    issued: observation.issued,
    encounter: encounterId
      ? extractEncounterDetails(encounterId, encountersMap)
      : undefined,
    members: members.length > 0 ? members : undefined,
    sortId,
    conceptId: observation.code?.coding?.[0]?.code,
    // conceptId is required to group the multiselect obs
  };
}

export function extractObservationsFromBundle(
  bundle: Bundle<Observation | Encounter>,
): ExtractedObservationsResult {
  const rawEncounters = new Map<string, Encounter>();
  const observationsMap = new Map<string, Observation>();
  const childIds = new Set<string>();

  bundle.entry?.forEach(({ resource }) => {
    if (!resource?.id) return;

    if (resource.resourceType === 'Encounter') {
      rawEncounters.set(resource.id, resource);
    } else if (resource.resourceType === 'Observation') {
      observationsMap.set(resource.id, resource);
      resource.hasMember?.forEach((m) => {
        const id = extractId(m);
        if (id) childIds.add(id);
      });
    }
  });

  const observations: ExtractedObservation[] = [];
  const groupedObservations: ExtractedObservation[] = [];

  observationsMap.forEach((obs, id) => {
    if (childIds.has(id)) return;

    const extracted = extractSingleObservation(
      obs,
      rawEncounters,
      observationsMap,
    );

    if (extracted.members) {
      groupedObservations.push(extracted);
    } else {
      observations.push(extracted);
    }
  });

  return { observations, groupedObservations };
}

export function groupObservationsByEncounter(
  result: ExtractedObservationsResult,
): ObservationsByEncounter[] {
  const encounterMap = new Map<
    string,
    {
      observations: ExtractedObservation[];
      groupedObservations: ExtractedObservation[];
    }
  >();

  result.observations.forEach((obs) => {
    if (!obs.encounter?.id) return;

    const encounterId = obs.encounter.id;
    if (!encounterMap.has(encounterId)) {
      encounterMap.set(encounterId, {
        observations: [],
        groupedObservations: [],
      });
    }
    encounterMap.get(encounterId)!.observations.push(obs);
  });

  result.groupedObservations.forEach((obs) => {
    if (!obs.encounter?.id) return;

    const encounterId = obs.encounter.id;
    if (!encounterMap.has(encounterId)) {
      encounterMap.set(encounterId, {
        observations: [],
        groupedObservations: [],
      });
    }
    encounterMap.get(encounterId)!.groupedObservations.push(obs);
  });

  return Array.from(encounterMap.entries()).map(([encounterId, data]) => {
    const encounterDetails =
      data.observations[0]?.encounter ?? data.groupedObservations[0]?.encounter;

    return {
      encounterId,
      encounterDetails,
      observations: data.observations,
      groupedObservations: data.groupedObservations,
    };
  });
}

export function sortObservationsByEncounterDate(
  observations: ObservationsByEncounter[],
): ObservationsByEncounter[] {
  return [...observations].sort((a, b) => {
    const dateA = a.encounterDetails?.date;
    const dateB = b.encounterDetails?.date;

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}
