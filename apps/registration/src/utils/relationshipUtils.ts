import type { RelationshipData } from '../components/forms/patientRelationships/PatientRelationships';

// A row is meaningful if the user has entered anything into it; used both to
// decide which rows to keep when saving and which rows require validation.
export const isRelationshipRowMeaningful = (rel: RelationshipData): boolean =>
  !!(
    rel.relationshipType.trim() ||
    rel.patientId.trim() ||
    rel.tillDate.trim()
  );
