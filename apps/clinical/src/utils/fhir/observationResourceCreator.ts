import { getFhirObservations, FhirReference } from '@bahmni/form2-controls';
import { Form2Observation } from '@bahmni/services';
import { Observation, Reference } from 'fhir/r4';

export const createObservationResources = (
  observations: Form2Observation[],
  subjectReference: Reference,
  encounterReference: Reference,
  performerReference: Reference,
): Array<{ resource: Observation; fullUrl: string }> => {
  try {
    return getFhirObservations(observations, {
      patientReference: subjectReference as FhirReference,
      encounterReference: encounterReference as FhirReference,
      performerReference: performerReference as FhirReference,
    }) as Array<{ resource: Observation; fullUrl: string }>;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown transformation error';
    throw new Error(
      `Failed to transform observations to FHIR format: ${errorMessage}`,
    );
  }
};
