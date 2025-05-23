import { Encounter } from 'fhir/r4';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';
import { FHIR_ENCOUNTER_TYPE_CODE_SYSTEM } from '@constants/fhir';
import {
  createEncounterLocationReference,
  createEncounterParticipantReference,
  createEncounterReference,
  createPatientReference,
} from './referenceCreator';

export const createEncounterResource = (
  encounterTypeUUID: string,
  encounterTypeDisplayText: string,
  patientUUID: string,
  participantUUIDs: string[],
  visitUUID: string,
  encounterLocationUUID: string,
  encounterStartTimestamp: Date,
): Encounter => {
  return {
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
    type: [
      createCodeableConcept([
        createCoding(
          encounterTypeUUID,
          FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
          encounterTypeDisplayText,
        ),
      ]),
    ],
    subject: createPatientReference(patientUUID),
    participant: participantUUIDs.map((uuid) =>
      createEncounterParticipantReference(uuid),
    ),
    partOf: createEncounterReference(visitUUID),
    location: [createEncounterLocationReference(encounterLocationUUID)],
    period: {
      start: encounterStartTimestamp.toISOString(),
    },
  };
};
