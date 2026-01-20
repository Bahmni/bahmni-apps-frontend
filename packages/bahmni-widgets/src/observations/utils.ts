import { Observation, Bundle, Encounter, Reference } from 'fhir/r4';
import {
  EncounterDetails,
  ObservationValue,
  ExtractedObservation,
  GroupedObservation,
  ExtractedObservationsResult,
  ObservationsByEncounter,
} from './models';

const extractId = (ref?: string | Reference): string | undefined => {
  const referenceStr = typeof ref === 'string' ? ref : ref?.reference;
  return referenceStr?.split('/')?.pop();
};

function extractObservationValue(
  observation: Observation,
): ObservationValue | undefined {
  const { valueQuantity, valueCodeableConcept, valueString } = observation;

  if (valueQuantity) {
    return {
      value: valueQuantity.value ?? '',
      unit: valueQuantity.unit,
      type: 'quantity',
    };
  }

  if (valueCodeableConcept) {
    return {
      value:
        valueCodeableConcept.text ?? valueCodeableConcept!.coding![0]!.display!,
      type: 'codeable',
    };
  }

  if (valueString) {
    return { value: valueString, type: 'string' };
  }

  return undefined;
}

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
  const groupedObservations: GroupedObservation[] = [];

  observationsMap.forEach((obs, id) => {
    if (childIds.has(id)) return;

    const extracted = extractSingleObservation(
      obs,
      rawEncounters,
      observationsMap,
    );

    if (extracted.members?.length) {
      groupedObservations.push({ ...extracted, children: extracted.members });
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
      groupedObservations: GroupedObservation[];
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

  return Array.from(encounterMap.entries()).map(([encounterId, data]) => ({
    encounterId,
    observations: data.observations,
    groupedObservations: data.groupedObservations,
  }));
}

export function sortObservationsByEncounterDate(
  observations: ObservationsByEncounter[],
): ObservationsByEncounter[] {
  return [...observations].sort((a, b) => {
    const dateA =
      a.observations[0]?.encounter?.date ??
      a.groupedObservations[0]?.encounter?.date;
    const dateB =
      b.observations[0]?.encounter?.date ??
      b.groupedObservations[0]?.encounter?.date;

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}
