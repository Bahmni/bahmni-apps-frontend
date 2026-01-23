import { formatDateTime } from '@bahmni/services';
import { Observation, Bundle, Encounter, Reference } from 'fhir/r4';
import {
  EncounterDetails,
  ObservationValue,
  ExtractedObservation,
  GroupedObservation,
  ExtractedObservationsResult,
  ObservationsByEncounter,
} from './models';

const NORMAL_REFERENCE_RANGE_CODE = 'normal';
const REFERENCE_RANGE_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/referencerange-meaning';
const ABNORMAL_INTERPRETATION_CODE = 'A';
const INTERPRETATION_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation';

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
  observation: ExtractedObservation | GroupedObservation,
): string => {
  const { value, unit } = observation.observationValue!;
  const baseValue = unit ? `${value} ${unit}` : String(value);
  return baseValue;
};

const formatObservationHeader = (
  observation: ExtractedObservation | GroupedObservation,
): string => {
  const { unit, referenceRange } = observation.observationValue!;
  const display = observation.display!;

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
) => {
  return {
    index,
    header: formatObservationHeader(observation),
    value: formatObservationValue(observation),
    provider: observation.encounter?.provider,
  };
};

const extractId = (ref?: string | Reference): string | undefined => {
  const referenceStr = typeof ref === 'string' ? ref : ref?.reference;
  return referenceStr?.split('/')?.pop();
};

function isAbnormalInterpretation(observation: Observation): boolean {
  if (!observation.interpretation || observation.interpretation.length === 0) {
    return false;
  }

  return observation.interpretation.some((interp) =>
    interp.coding?.some(
      (coding) =>
        coding.system === INTERPRETATION_SYSTEM &&
        coding.code === ABNORMAL_INTERPRETATION_CODE,
    ),
  );
}

function extractObservationValue(
  observation: Observation,
): ObservationValue | undefined {
  const { valueQuantity, valueCodeableConcept, valueString, referenceRange } =
    observation;

  const isAbnormal = isAbnormalInterpretation(observation);

  if (valueQuantity) {
    const observationValue: ObservationValue = {
      value: valueQuantity.value ?? '',
      unit: valueQuantity.unit,
      type: 'quantity',
      isAbnormal,
    };

    if (referenceRange && referenceRange.length > 0) {
      const normalRange = referenceRange.find((range) =>
        range.type?.coding?.some(
          (coding) =>
            coding.system === REFERENCE_RANGE_SYSTEM &&
            coding.code === NORMAL_REFERENCE_RANGE_CODE,
        ),
      );

      if (normalRange && (normalRange.low || normalRange.high)) {
        observationValue.referenceRange = {
          low: normalRange.low
            ? {
                value: normalRange.low.value!,
                unit: normalRange.low.unit,
              }
            : undefined,
          high: normalRange.high
            ? {
                value: normalRange.high.value!,
                unit: normalRange.high.unit,
              }
            : undefined,
        };
      }
    }

    return observationValue;
  }

  if (valueCodeableConcept) {
    return {
      value:
        valueCodeableConcept.text ?? valueCodeableConcept!.coding![0]!.display!,
      type: 'codeable',
      isAbnormal,
    };
  }

  if (valueString) {
    return {
      value: valueString,
      type: 'string',
      isAbnormal,
    };
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
