import { formatDateTime } from '@bahmni/services';
import { Observation, Bundle, Encounter, Reference } from 'fhir/r4';
import {
  EncounterDetails,
  ObservationValue,
  ExtractedObservation,
  GroupedObservation,
  ExtractedObservationsResult,
  ObservationsByEncounter,
  ObservationsByEncounterAndForm,
  ObservationsByForm,
} from './models';

export const formatEncounterTitle = (
  encounterDetails: EncounterDetails | undefined,
  t: (key: string) => string,
): string => {
  if (!encounterDetails?.date) {
    return t('UNKNOWN_ENCOUNTER');
  }
  const result = formatDateTime(encounterDetails.date, t);
  return result.formattedResult;
};

export const formatObservationValue = (
  observation: ExtractedObservation | GroupedObservation,
): string => {
  const { value, unit } = observation.observationValue!;
  return unit ? `${value} ${unit}` : String(value);
};

export const transformObservationToRowCell = (
  observation: ExtractedObservation,
  index: number,
) => {
  return {
    index,
    header: observation.display,
    value: formatObservationValue(observation),
    provider: observation.encounter?.provider,
  };
};

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

function extractFormNameFromExtension(
  observation: Observation,
): string | undefined {
  const formExtension = observation.extension?.find(
    (ext) =>
      ext.url === 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
  );

  if (!formExtension?.valueString) {
    return undefined;
  }

  const match = formExtension.valueString.match(/\^([^.]+)/);
  return match![1];
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
    fileName: extractFormNameFromExtension(observation),
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

export function sortObservationsByEncounterDate<
  T extends ObservationsByEncounter | ObservationsByEncounterAndForm,
>(observations: T[]): T[] {
  return [...observations].sort((a, b) => {
    const dateA = a.encounterDetails?.date;
    const dateB = b.encounterDetails?.date;

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}

export function groupObservationsByEncounterAndForm(
  result: ExtractedObservationsResult,
): ObservationsByEncounterAndForm[] {
  const encounterMap = new Map<
    string,
    Map<
      string,
      {
        observations: ExtractedObservation[];
        groupedObservations: GroupedObservation[];
      }
    >
  >();

  result.observations.forEach((obs) => {
    if (!obs.encounter?.id || !obs.fileName) return;

    const encounterId = obs.encounter.id;
    const formName = obs.fileName;

    if (!encounterMap.has(encounterId)) {
      encounterMap.set(encounterId, new Map());
    }

    const formMap = encounterMap.get(encounterId)!;
    if (!formMap.has(formName)) {
      formMap.set(formName, {
        observations: [],
        groupedObservations: [],
      });
    }

    formMap.get(formName)!.observations.push(obs);
  });

  result.groupedObservations.forEach((obs) => {
    if (!obs.encounter?.id || !obs.fileName) return;

    const encounterId = obs.encounter.id;
    const formName = obs.fileName;

    if (!encounterMap.has(encounterId)) {
      encounterMap.set(encounterId, new Map());
    }

    const formMap = encounterMap.get(encounterId)!;
    if (!formMap.has(formName)) {
      formMap.set(formName, {
        observations: [],
        groupedObservations: [],
      });
    }

    formMap.get(formName)!.groupedObservations.push(obs);
  });

  return Array.from(encounterMap.entries()).map(([encounterId, formMap]) => {
    const allFormData = Array.from(formMap.values());
    const encounterDetails =
      allFormData[0]?.observations[0]?.encounter ??
      allFormData[0]?.groupedObservations[0]?.encounter;

    return {
      encounterId,
      encounterDetails,
      formGroups: Array.from(formMap.entries()).map(
        ([formName, data]): ObservationsByForm => ({
          formName,
          observations: data.observations,
          groupedObservations: data.groupedObservations,
        }),
      ),
    };
  });
}
