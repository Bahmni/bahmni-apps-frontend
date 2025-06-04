import { AllergyIntolerance, Reference } from 'fhir/r4';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';

interface AllergyReaction {
  manifestationUUIDs: string[];
  severity?: 'mild' | 'moderate' | 'severe';
}

/**
 * Creates a FHIR AllergyIntolerance resource for an encounter
 * @param allergenConceptUUID - UUID of the allergen concept
 * @param category - Array of categories (e.g., ['medication'])
 * @param reactions - Array of reactions with manifestations and optional severity
 * @param patientReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param recorderReference - Reference to the practitioner recording the allergy
 * @returns FHIR AllergyIntolerance resource
 */
export const createEncounterAllergyResource = (
  allergenConceptUUID: string,
  category: Array<'food' | 'medication' | 'environment' | 'biologic'>,
  reactions: AllergyReaction[],
  patientReference: Reference,
  encounterReference: Reference,
  recorderReference: Reference,
): AllergyIntolerance => {
  const resource: AllergyIntolerance = {
    resourceType: 'AllergyIntolerance',
    category,
    code: createCodeableConcept([createCoding(allergenConceptUUID)]),
    patient: patientReference,
    recorder: recorderReference,
    encounter: encounterReference,
  };

  if (reactions.length > 0) {
    resource.reaction = reactions.map((reaction) => ({
      manifestation: reaction.manifestationUUIDs.map((uuid) => ({
        coding: [createCoding(uuid)],
      })),
      ...(reaction.severity && { severity: reaction.severity }),
    }));
  }

  return resource;
};
