import {
  getPlaceholderReference,
  createPatientReference,
  createEncounterReference,
  getLocationReference,
  createEncounterLocationReference,
  createPractitionerReference,
  createEncounterParticipantReference,
} from '../referenceCreator';

describe('referenceCreator utility functions', () => {
  describe('getPlaceholderReference', () => {
    it('should create a reference with the provided placeholder UUID', () => {
      // Arrange
      const placeholderUUID = 'placeholder-uuid-123';

      // Act
      const result = getPlaceholderReference(placeholderUUID);

      // Assert
      expect(result).toEqual({
        reference: placeholderUUID,
      });
    });
  });

  describe('createPatientReference', () => {
    it('should create a reference to a Patient resource with the provided UUID', () => {
      // Arrange
      const patientUUID = 'patient-uuid-123';

      // Act
      const result = createPatientReference(patientUUID);

      // Assert
      expect(result).toEqual({
        reference: `Patient/${patientUUID}`,
      });
    });
  });

  describe('createEncounterReference', () => {
    it('should create a reference to an Encounter resource with the provided UUID', () => {
      // Arrange
      const encounterUUID = 'encounter-uuid-123';

      // Act
      const result = createEncounterReference(encounterUUID);

      // Assert
      expect(result).toEqual({
        reference: `Encounter/${encounterUUID}`,
      });
    });
  });

  describe('getLocationReference', () => {
    it('should create a reference to a Location resource with the provided UUID', () => {
      // Arrange
      const locationUUID = 'location-uuid-123';

      // Act
      const result = getLocationReference(locationUUID);

      // Assert
      expect(result).toEqual({
        reference: `Location/${locationUUID}`,
      });
    });
  });

  describe('createEncounterLocationReference', () => {
    it('should create an EncounterLocation with a location reference', () => {
      // Arrange
      const locationUUID = 'location-uuid-123';

      // Act
      const result = createEncounterLocationReference(locationUUID);

      // Assert
      expect(result).toEqual({
        location: {
          reference: `Location/${locationUUID}`,
        },
      });
    });
  });

  describe('createPractitionerReference', () => {
    it('should create a reference to a Practitioner resource with the provided UUID and type', () => {
      // Arrange
      const practitionerUUID = 'practitioner-uuid-123';

      // Act
      const result = createPractitionerReference(practitionerUUID);

      // Assert
      expect(result).toEqual({
        reference: `Practitioner/${practitionerUUID}`,
        type: 'Practitoner',
      });
    });
  });

  describe('createEncounterParticipantReference', () => {
    it('should create an EncounterParticipant with a practitioner reference', () => {
      // Arrange
      const practitionerUUID = 'practitioner-uuid-123';

      // Act
      const result = createEncounterParticipantReference(practitionerUUID);

      // Assert
      expect(result).toEqual({
        individual: {
          reference: `Practitioner/${practitionerUUID}`,
          type: 'Practitoner',
        },
      });
    });
  });
});
