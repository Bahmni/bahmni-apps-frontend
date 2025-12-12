import { ObservationPayload } from '@bahmni/services';
import { Observation, Reference } from 'fhir/r4';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';

/**
 * Creates a FHIR R4 Observation resource from ObservationPayload
 * @param observationPayload - The observation payload from form
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param performerReference - Reference to the practitioner
 * @param formNamespacePath - Optional form namespace path for extension
 * @returns FHIR R4 Observation resource
 */
export const createObservationResource = (
  observationPayload: ObservationPayload,
  subjectReference: Reference,
  encounterReference: Reference,
  performerReference: Reference,
  formNamespacePath?: string,
): Observation => {
  const observation: Observation = {
    resourceType: 'Observation',
    status: 'final',
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

  if (value instanceof Date) {
    // Date object - use valueDateTime
    observation.valueDateTime = value.toISOString();
  } else if (typeof value === 'number') {
    // Numeric value - use valueQuantity
    observation.valueQuantity = { value: value };
  } else if (typeof value === 'string') {
    const trimmedValue = value.trim();

    const isISODate = /^\d{4}-\d{2}-\d{2}/.test(trimmedValue);
    if (isISODate) {
      const dateValue = new Date(trimmedValue);
      if (!isNaN(dateValue.getTime())) {
        observation.valueDateTime = dateValue.toISOString();
        return observation;
      }
    }
    const numericValue = parseFloat(trimmedValue);
    if (!isNaN(numericValue) && trimmedValue !== '') {
      // String contains a numeric value - convert to valueQuantity
      observation.valueQuantity = { value: numericValue };
    } else if (trimmedValue !== '') {
      // Text string - use valueString
      observation.valueString = value;
    }
  } else if (typeof value === 'boolean') {
    // Boolean value - use valueBoolean
    observation.valueBoolean = value;
  } else if (value && typeof value === 'object' && 'uuid' in value) {
    // ConceptValue - coded answer - use valueCodeableConcept
    observation.valueCodeableConcept = createCodeableConcept([
      createCoding(value.uuid, undefined, value.display),
    ]);
  }

  // Add form namespace path extension if provided
  if (formNamespacePath) {
    observation.extension = [
      {
        url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
        valueString: formNamespacePath,
      },
    ];
  }

  // Handle group members (nested observations)
  if (
    observationPayload.groupMembers &&
    observationPayload.groupMembers.length > 0
  ) {
    observation.hasMember = observationPayload.groupMembers.map(() => {
      // Create placeholder references for group members
      // These will be resolved by the FHIR server
      return {
        reference: `urn:uuid:${crypto.randomUUID()}`,
      };
    });
  }

  // Handle comments
  if (observationPayload.comment) {
    observation.note = [
      {
        text: observationPayload.comment,
      },
    ];
  }

  return observation;
};

/**
 * Recursively creates FHIR Observation resources from ObservationPayload array
 * Handles nested group members
 * @param observations - Array of observation payloads
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param performerReference - Reference to the practitioner
 * @returns Array of FHIR R4 Observation resources
 */
export const createObservationResources = (
  observations: ObservationPayload[],
  subjectReference: Reference,
  encounterReference: Reference,
  performerReference: Reference,
): Observation[] => {
  const resources: Observation[] = [];

  for (const obs of observations) {
    const observation = createObservationResource(
      obs,
      subjectReference,
      encounterReference,
      performerReference,
    );
    resources.push(observation);

    // Recursively process group members
    if (obs.groupMembers && obs.groupMembers.length > 0) {
      const memberResources = createObservationResources(
        obs.groupMembers,
        subjectReference,
        encounterReference,
        performerReference,
      );
      resources.push(...memberResources);
    }
  }

  return resources;
};
