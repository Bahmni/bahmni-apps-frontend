import { ObservationDataInFormControls } from '@bahmni/services';
import { Observation, Reference } from 'fhir/r4';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';

// Map interpretation values from form2-controls to FHIR codes
const INTERPRETATION_TO_CODE: Record<
  string,
  { code: string; display: string }
> = {
  ABNORMAL: { code: 'A', display: 'Abnormal' },
  NORMAL: { code: 'N', display: 'Normal' },
};

/**
 * Creates a FHIR R4 Observation resource from ObservationDataInFormControls
 * @param observationPayload - The observation data from form2-controls
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param performerReference - Reference to the practitioner
 * @param formNamespacePath - Optional form namespace path for extension
 * @returns FHIR R4 Observation resource
 */
export const createObservationResource = (
  observationPayload: ObservationDataInFormControls,
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

  // Add interpretation if provided (receives "ABNORMAL" or "NORMAL" from form2-controls)
  // If null/undefined, don't include interpretation field
  if (observationPayload.interpretation) {
    const interpretationValue = observationPayload.interpretation.toUpperCase();
    const mapping =
      INTERPRETATION_TO_CODE[interpretationValue] ||
      INTERPRETATION_TO_CODE.NORMAL;

    observation.interpretation = [
      {
        coding: [
          {
            system:
              'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: mapping.code,
            display: mapping.display,
          },
        ],
      },
    ];
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
 * Recursively creates FHIR Observation resources from ObservationDataInFormControls array
 * Handles nested group members
 * @param observations - Array of observation data from form2-controls
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param performerReference - Reference to the practitioner
 * @returns Array of FHIR R4 Observation resources
 */
export const createObservationResources = (
  observations: ObservationDataInFormControls[],
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
