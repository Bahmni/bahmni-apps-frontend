import {
  getPlaceholderReference,
  createPatientReference,
  createEncounterReference,
  getLocationReference,
  createEncounterLocationReference,
  createPractitionerReference,
  createEncounterParticipantReference,
  createMedicationReference,
} from '../referenceCreator';

describe('referenceCreator utility functions', () => {
  describe('getPlaceholderReference', () => {
    it('should create a reference with the provided placeholder UUID', () => {
      const placeholderUUID = 'placeholder-uuid-123';

      const result = getPlaceholderReference(placeholderUUID);

      expect(result).toEqual({
        reference: placeholderUUID,
      });
    });
  });

  describe('createPatientReference', () => {
    it('should create a reference to a Patient resource with the provided UUID', () => {
      const patientUUID = 'patient-uuid-123';

      const result = createPatientReference(patientUUID);

      expect(result).toEqual({
        reference: `Patient/${patientUUID}`,
      });
    });
  });

  describe('createEncounterReference', () => {
    it('should create a reference to an Encounter resource with the provided UUID', () => {
      const encounterUUID = 'encounter-uuid-123';

      const result = createEncounterReference(encounterUUID);

      expect(result).toEqual({
        reference: `Encounter/${encounterUUID}`,
      });
    });
  });

  describe('getLocationReference', () => {
    it('should create a reference to a Location resource with the provided UUID', () => {
      const locationUUID = 'location-uuid-123';

      const result = getLocationReference(locationUUID);

      expect(result).toEqual({
        reference: `Location/${locationUUID}`,
      });
    });
  });

  describe('createEncounterLocationReference', () => {
    it('should create an EncounterLocation with a location reference', () => {
      const locationUUID = 'location-uuid-123';

      const result = createEncounterLocationReference(locationUUID);

      expect(result).toEqual({
        location: {
          reference: `Location/${locationUUID}`,
        },
      });
    });
  });

  describe('createPractitionerReference', () => {
    it('should create a reference to a Practitioner resource with the provided UUID and type', () => {
      const practitionerUUID = 'practitioner-uuid-123';

      const result = createPractitionerReference(practitionerUUID);

      expect(result).toEqual({
        reference: `Practitioner/${practitionerUUID}`,
        type: 'Practitioner',
      });
    });
  });

  describe('createEncounterParticipantReference', () => {
    it('should create an EncounterParticipant with a practitioner reference', () => {
      const practitionerUUID = 'practitioner-uuid-123';

      const result = createEncounterParticipantReference(practitionerUUID);

      expect(result).toEqual({
        individual: {
          reference: `Practitioner/${practitionerUUID}`,
          type: 'Practitioner',
        },
      });
    });
  });

  describe('createMedicationReference', () => {
    it('should create a reference to a Medication resource with the provided ID and type', () => {
      const medicationId = 'medication-id-123';

      const result = createMedicationReference(medicationId);

      expect(result).toEqual({
        reference: `Medication/${medicationId}`,
        type: 'Medication',
      });
    });

    it('should handle medication IDs with special characters', () => {
      const medicationId = 'med-456-abc_def';

      const result = createMedicationReference(medicationId);

      expect(result).toEqual({
        reference: `Medication/${medicationId}`,
        type: 'Medication',
      });
    });

    it('should handle empty medication ID', () => {
      const medicationId = '';

      const result = createMedicationReference(medicationId);

      expect(result).toEqual({
        reference: 'Medication/',
        type: 'Medication',
      });
    });
  });
});
