import {
  Form2Observation,
  CONCEPT_DATATYPE_NUMERIC,
  CONCEPT_DATATYPE_COMPLEX,
  FHIR_OBSERVATION_INTERPRETATION_SYSTEM,
  FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
  FHIR_OBSERVATION_COMPLEX_DATA_URL,
  FHIR_OBSERVATION_STATUS_FINAL,
  FHIR_RESOURCE_TYPE_OBSERVATION,
  DATE_REGEX_PATTERN,
  INTERPRETATION_TO_CODE,
} from '@bahmni/services';
import { Observation, Reference } from 'fhir/r4';

import { createCodeableConcept, createCoding } from './codeableConceptCreator';

const handleStringValue = (
  value: string,
  observation: Observation,
  conceptDatatype?: string,
): void => {
  const trimmedValue = value.trim();

  if (trimmedValue === '') {
    return;
  }

  if (DATE_REGEX_PATTERN.test(trimmedValue)) {
    const dateValue = new Date(trimmedValue);
    if (!isNaN(dateValue.getTime())) {
      observation.valueDateTime = dateValue.toISOString();
      return;
    }
  }

  if (conceptDatatype === CONCEPT_DATATYPE_NUMERIC) {
    const numericValue = parseFloat(trimmedValue);
    if (!isNaN(numericValue)) {
      observation.valueQuantity = { value: numericValue };
      return;
    }
  }

  observation.valueString = value;
};

export const createObservationResource = (
  observationPayload: Form2Observation,
  subjectReference: Reference,
  encounterReference: Reference,
  performerReference: Reference,
): Observation => {
  const observation: Observation = {
    resourceType: FHIR_RESOURCE_TYPE_OBSERVATION,
    status: FHIR_OBSERVATION_STATUS_FINAL,
    code: createCodeableConcept([
      createCoding(observationPayload.concept.uuid),
    ]),
    subject: subjectReference,
    encounter: encounterReference,
    performer: [performerReference],
    effectiveDateTime:
      observationPayload.obsDatetime ?? new Date().toISOString(),
  };

  const value = observationPayload.value;
  const conceptDatatype = observationPayload.concept.datatype;

  if (value !== null && value !== undefined) {
    switch (typeof value) {
      case 'number':
        observation.valueQuantity = { value };
        break;
      case 'string': {
        if (
          conceptDatatype === CONCEPT_DATATYPE_COMPLEX &&
          value.trim() !== ''
        ) {
          //TODO - Image/Video Handling
          observation.extension ??= [];
          observation.extension.push({
            url: FHIR_OBSERVATION_COMPLEX_DATA_URL,
            valueAttachment: { url: value },
          });
          observation.valueString = value;
        } else {
          handleStringValue(value, observation, conceptDatatype);
        }
        break;
      }
      case 'boolean':
        observation.valueBoolean = value;
        break;
      case 'object':
        if (value instanceof Date) {
          observation.valueDateTime = value.toISOString();
        } else if ('uuid' in value) {
          observation.valueCodeableConcept = createCodeableConcept([
            createCoding(
              value.uuid as string,
              undefined,
              (value as { display?: string }).display,
            ),
          ]);
        }
        break;
    }
  }

  if (observationPayload.interpretation) {
    const interpretationValue = observationPayload.interpretation.toUpperCase();
    const mapping =
      INTERPRETATION_TO_CODE[interpretationValue] ||
      INTERPRETATION_TO_CODE.NORMAL;

    observation.interpretation = [
      {
        coding: [
          {
            system: FHIR_OBSERVATION_INTERPRETATION_SYSTEM,
            code: mapping.code,
            display: mapping.display,
          },
        ],
      },
    ];
  }

  if (observationPayload.formNamespace && observationPayload.formFieldPath) {
    observation.extension ??= [];
    observation.extension.push({
      url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
      valueString: `${observationPayload.formNamespace}^${observationPayload.formFieldPath}`,
    });
  }

  if (observationPayload.comment) {
    observation.note = [
      {
        text: observationPayload.comment,
      },
    ];
  }

  return observation;
};

export const createObservationResources = (
  observations: Form2Observation[],
  subjectReference: Reference,
  encounterReference: Reference,
  performerReference: Reference,
): Array<{ resource: Observation; fullUrl: string }> => {
  const results: Array<{ resource: Observation; fullUrl: string }> = [];

  for (const obs of observations) {
    if (obs.groupMembers && obs.groupMembers.length > 0) {
      const memberResults = createObservationResources(
        obs.groupMembers,
        subjectReference,
        encounterReference,
        performerReference,
      );

      results.push(...memberResults);

      const parentObservation = createObservationResource(
        obs,
        subjectReference,
        encounterReference,
        performerReference,
      );

      parentObservation.hasMember = memberResults.map((member) => ({
        reference: member.fullUrl,
        type: 'Observation',
      }));

      const parentUuid = crypto.randomUUID();
      const parentFullUrl = `urn:uuid:${parentUuid}`;

      const parentObservationWithId: Observation = {
        ...parentObservation,
        id: parentUuid,
      };

      results.push({
        resource: parentObservationWithId,
        fullUrl: parentFullUrl,
      });
    } else {
      const observation = createObservationResource(
        obs,
        subjectReference,
        encounterReference,
        performerReference,
      );

      const uuid = crypto.randomUUID();
      const fullUrl = `urn:uuid:${uuid}`;

      const observationWithId: Observation = {
        ...observation,
        id: uuid,
      };

      results.push({ resource: observationWithId, fullUrl });
    }
  }

  return results;
};
