import { FHIR_ENCOUNTER_TYPE_CODE_SYSTEM } from '@bahmni-frontend/bahmni-services';
import { createCodeableConcept, createCoding } from '../codeableConceptCreator';
import { createEncounterResource } from '../encounterResourceCreator';
import {
  createEncounterLocationReference,
  createEncounterParticipantReference,
  createEncounterReference,
  createPatientReference,
} from '../referenceCreator';

// Mock the imported functions
jest.mock('../codeableConceptCreator', () => ({
  createCodeableConcept: jest.fn(),
  createCoding: jest.fn(),
}));

jest.mock('../referenceCreator', () => ({
  createEncounterLocationReference: jest.fn(),
  createEncounterParticipantReference: jest.fn(),
  createEncounterReference: jest.fn(),
  createPatientReference: jest.fn(),
}));

describe('encounterResourceCreator utility functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock return values
    (createCoding as jest.Mock).mockReturnValue({ code: 'mock-code' });
    (createCodeableConcept as jest.Mock).mockReturnValue({
      coding: [{ code: 'mock-code' }],
    });
    (createPatientReference as jest.Mock).mockReturnValue({
      reference: 'Patient/mock-patient',
    });
    (createEncounterParticipantReference as jest.Mock).mockReturnValue({
      individual: { reference: 'Practitioner/mock' },
    });
    (createEncounterReference as jest.Mock).mockReturnValue({
      reference: 'Encounter/mock-visit',
    });
    (createEncounterLocationReference as jest.Mock).mockReturnValue({
      location: { reference: 'Location/mock' },
    });
  });

  describe('createEncounterResource', () => {
    it('should create an Encounter resource with the provided parameters', () => {
      // Arrange
      const encounterTypeUUID = 'encounter-type-uuid';
      const encounterTypeDisplayText = 'Consultation';
      const patientUUID = 'patient-uuid';
      const participantUUIDs = ['practitioner-uuid-1', 'practitioner-uuid-2'];
      const visitUUID = 'visit-uuid';
      const encounterLocationUUID = 'location-uuid';
      const encounterStartTimestamp = new Date('2023-01-01T12:00:00Z');

      // Act
      const result = createEncounterResource(
        encounterTypeUUID,
        encounterTypeDisplayText,
        patientUUID,
        participantUUIDs,
        visitUUID,
        encounterLocationUUID,
        encounterStartTimestamp,
      );

      // Assert
      expect(result).toEqual({
        resourceType: 'Encounter',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory',
        },
        status: 'in-progress',
        meta: {
          tag: [
            {
              system: 'http://fhir.openmrs.org/ext/encounter-tag',
              code: 'encounter',
              display: 'Encounter',
            },
          ],
        },
        type: [{ coding: [{ code: 'mock-code' }] }],
        subject: { reference: 'Patient/mock-patient' },
        participant: [
          { individual: { reference: 'Practitioner/mock' } },
          { individual: { reference: 'Practitioner/mock' } },
        ],
        partOf: { reference: 'Encounter/mock-visit' },
        location: [{ location: { reference: 'Location/mock' } }],
        period: {
          start: encounterStartTimestamp.toISOString(),
        },
      });

      // Verify mock calls
      expect(createCoding).toHaveBeenCalledWith(
        encounterTypeUUID,
        FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
        encounterTypeDisplayText,
      );
      expect(createCodeableConcept).toHaveBeenCalledWith([
        { code: 'mock-code' },
      ]);
      expect(createPatientReference).toHaveBeenCalledWith(patientUUID);
      expect(createEncounterParticipantReference).toHaveBeenCalledTimes(2);
      expect(createEncounterParticipantReference).toHaveBeenCalledWith(
        'practitioner-uuid-1',
      );
      expect(createEncounterParticipantReference).toHaveBeenCalledWith(
        'practitioner-uuid-2',
      );
      expect(createEncounterReference).toHaveBeenCalledWith(visitUUID);
      expect(createEncounterLocationReference).toHaveBeenCalledWith(
        encounterLocationUUID,
      );
    });

    it('should handle empty participant UUIDs array', () => {
      // Arrange
      const encounterTypeUUID = 'encounter-type-uuid';
      const encounterTypeDisplayText = 'Consultation';
      const patientUUID = 'patient-uuid';
      const participantUUIDs: string[] = [];
      const visitUUID = 'visit-uuid';
      const encounterLocationUUID = 'location-uuid';
      const encounterStartTimestamp = new Date('2023-01-01T12:00:00Z');

      // Act
      const result = createEncounterResource(
        encounterTypeUUID,
        encounterTypeDisplayText,
        patientUUID,
        participantUUIDs,
        visitUUID,
        encounterLocationUUID,
        encounterStartTimestamp,
      );

      // Assert
      expect(result.participant).toEqual([]);
      expect(createEncounterParticipantReference).not.toHaveBeenCalled();
    });
  });
});
