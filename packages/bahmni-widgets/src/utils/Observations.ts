import type { Observation, Reference } from 'fhir/r4';
import { ExtractedObservation, ObservationValue } from '../observations/models';

const NORMAL_REFERENCE_RANGE_CODE = 'normal';
// FHIR canonical URI - identifier defined by HL7 spec, not an actual HTTP endpoint
const REFERENCE_RANGE_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/referencerange-meaning'; // NOSONAR
const ABNORMAL_INTERPRETATION_CODE = 'A';
// FHIR canonical URI - identifier defined by HL7 spec, not an actual HTTP endpoint
const INTERPRETATION_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation'; // NOSONAR

export const extractId = (ref?: string | Reference): string | undefined => {
  const referenceStr = typeof ref === 'string' ? ref : ref?.reference;
  return referenceStr?.split('/')?.pop();
};

export function isAbnormalInterpretation(observation: Observation): boolean {
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

function extractReferenceRange(
  referenceRange: Observation['referenceRange'],
): ObservationValue['referenceRange'] {
  if (!referenceRange || referenceRange.length === 0) {
    return undefined;
  }

  const normalRange = referenceRange.find((range) =>
    range.type?.coding?.some(
      (coding) =>
        coding.system === REFERENCE_RANGE_SYSTEM &&
        coding.code === NORMAL_REFERENCE_RANGE_CODE,
    ),
  );

  if (!normalRange || (!normalRange.low && !normalRange.high)) {
    return undefined;
  }

  return {
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

function createObservationValue(
  value: string | number | boolean,
  type: ObservationValue['type'],
  isAbnormal: boolean,
  unit?: string,
  referenceRange?: ObservationValue['referenceRange'],
): ObservationValue {
  return {
    value,
    type,
    isAbnormal,
    ...(unit && { unit }),
    ...(referenceRange && { referenceRange }),
  };
}

export function extractObservationValue(
  observation: Observation,
): ObservationValue | undefined {
  const {
    valueQuantity,
    valueCodeableConcept,
    valueString,
    valueBoolean,
    valueInteger,
    valueDateTime,
    valueTime,
    referenceRange,
  } = observation;

  const isAbnormal = isAbnormalInterpretation(observation);

  if (valueQuantity) {
    return createObservationValue(
      valueQuantity.value ?? '',
      'quantity',
      isAbnormal,
      valueQuantity.unit,
      extractReferenceRange(referenceRange),
    );
  }

  if (valueCodeableConcept) {
    return createObservationValue(
      valueCodeableConcept.text ?? valueCodeableConcept.coding![0].display!,
      'codeable',
      isAbnormal,
    );
  }

  if (valueString) {
    return createObservationValue(valueString, 'string', isAbnormal);
  }

  if (valueDateTime) {
    return createObservationValue(valueDateTime, 'dateTime', isAbnormal);
  }

  if (valueTime) {
    return createObservationValue(valueTime, 'time', isAbnormal);
  }

  if (valueBoolean !== undefined) {
    return createObservationValue(valueBoolean, 'boolean', isAbnormal);
  }

  if (valueInteger !== undefined) {
    return createObservationValue(valueInteger, 'integer', isAbnormal);
  }

  return undefined;
}

export function getObservationDisplayInfo(observation: ExtractedObservation): {
  rangeString: string;
  isAbnormal: boolean;
} {
  const observationValue = observation.observationValue;
  if (!observationValue) {
    return { rangeString: '', isAbnormal: false };
  }

  const { referenceRange } = observationValue;
  const lowNormal = referenceRange?.low?.value;
  const hiNormal = referenceRange?.high?.value;

  const hasLow = lowNormal != null;
  const hasHigh = hiNormal != null;

  let rangeString = '';
  if (hasLow && hasHigh) {
    rangeString = ` (${lowNormal} - ${hiNormal})`;
  } else if (hasLow) {
    rangeString = ` (>${lowNormal})`;
  } else if (hasHigh) {
    rangeString = ` (<${hiNormal})`;
  }

  const isAbnormal = observationValue.isAbnormal ?? false;

  return { rangeString, isAbnormal };
}

export function sortObservationsBySortId(
  observations: ExtractedObservation[],
): ExtractedObservation[] {
  return [...observations].sort(
    ({ sortId: xSortId = '' }, { sortId: ySortId = '' }) =>
      xSortId.localeCompare(ySortId, undefined, { numeric: true }),
  );
}

export function groupMultiSelectObservations(
  observations: ExtractedObservation[],
): ExtractedObservation[] {
  return observations.reduce(
    (
      valueGroupedObs: ExtractedObservation[],
      observation: ExtractedObservation,
    ) => {
      // Only group if conceptId is defined and truthy
      const matchedObs = observation.conceptId
        ? valueGroupedObs.find(
            (obs: ExtractedObservation) =>
              obs.conceptId === observation.conceptId,
          )
        : undefined;

      if (matchedObs?.observationValue && observation.observationValue) {
        matchedObs.observationValue.value =
          matchedObs.observationValue.value +
          ', ' +
          observation.observationValue.value;
      } else {
        valueGroupedObs.push(observation);
      }
      return valueGroupedObs;
    },
    [],
  );
}

export function transformObservations(
  observations: Observation[],
): ExtractedObservation[] {
  const observationsMap = new Map<string, Observation>();
  const childIds = new Set<string>();

  observations.forEach((obs) => {
    if (!obs.id) return;
    observationsMap.set(obs.id, obs);
    obs.hasMember?.forEach((memberRef) => {
      const id = extractId(memberRef);
      if (id) childIds.add(id);
    });
  });

  const extractSingleObservation = (
    observation: Observation,
  ): ExtractedObservation => {
    const members = (observation.hasMember ?? [])
      .map((ref) => extractId(ref))
      .map((id) => (id ? observationsMap.get(id) : undefined))
      .filter((obs): obs is Observation => !!obs)
      .map((obs) => extractSingleObservation(obs));

    const groupedMembers =
      members.length > 0 ? groupMultiSelectObservations(members) : [];

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
      members: groupedMembers.length > 0 ? groupedMembers : undefined,
      sortId,
      conceptId: observation.code?.coding?.[0]?.code,
      comment: observation.note?.[0]?.text,
    };
  };

  const allObservations: ExtractedObservation[] = [];

  observationsMap.forEach((obs, id) => {
    if (childIds.has(id)) return;
    const extracted = extractSingleObservation(obs);
    allObservations.push(extracted);
  });

  return allObservations;
}
