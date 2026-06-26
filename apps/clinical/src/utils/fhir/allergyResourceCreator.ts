import { AllergyIntolerance, CodeableConcept, Reference } from 'fhir/r4';
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
 * @param note - Optional note about the allergy
 * @returns FHIR AllergyIntolerance resource
 */
export const createEncounterAllergyResource = (
  allergenConceptUUID: string,
  category: Array<'food' | 'medication' | 'environment' | 'biologic'>,
  reactions: AllergyReaction[],
  patientReference: Reference,
  encounterReference: Reference,
  recorderReference: Reference,
  note?: string,
): AllergyIntolerance => {
  const resource: AllergyIntolerance = {
    resourceType: 'AllergyIntolerance',
    category,
    code: createCodeableConcept([createCoding(allergenConceptUUID)]),
    patient: patientReference,
    recorder: recorderReference,
    encounter: encounterReference,
  };

  resource.reaction = reactions.map((reaction) => ({
    manifestation: reaction.manifestationUUIDs.map((uuid) => ({
      coding: [createCoding(uuid)],
    })),
    ...(reaction.severity && { severity: reaction.severity }),
  }));

  if (note && note.trim() !== '') {
    resource.note = [
      {
        text: note.trim(),
      },
    ];
  }

  return resource;
};

/**
 * Builds a PUT AllergyIntolerance resource for updating an existing allergy.
 * Explicitly picks only the fields needed — never spreads the raw server
 * response so server-generated fields (text.div narrative, etc.) are excluded.
 */
export const createDeleteAllergyResource = (id: string): AllergyIntolerance =>
  ({ resourceType: 'AllergyIntolerance', id }) as AllergyIntolerance;

export const updateEncounterAllergyResource = (
  existing: AllergyIntolerance,
  manifestations: CodeableConcept[],
  severity: 'mild' | 'moderate' | 'severe',
  encounterReference: Reference,
  note?: string,
): AllergyIntolerance => ({
  resourceType: 'AllergyIntolerance',
  id: existing.id,
  meta: existing.meta,
  clinicalStatus: existing.clinicalStatus,
  verificationStatus: existing.verificationStatus,
  type: existing.type,
  category: existing.category,
  criticality: existing.criticality,
  code: existing.code,
  patient: existing.patient,
  recordedDate: existing.recordedDate,
  recorder: existing.recorder,
  note: note?.trim() ? [{ text: note.trim() }] : undefined,
  encounter: encounterReference,
  reaction: [
    {
      substance: existing.code,
      manifestation: manifestations,
      severity,
    },
  ],
});
