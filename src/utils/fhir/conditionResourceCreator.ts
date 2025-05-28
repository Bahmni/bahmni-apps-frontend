import { Condition, Reference } from 'fhir/r4';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';
import { HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM } from '@constants/fhir';

export const createEncounterDiagnosisResource = (
  diagnosisConceptUUID: string,
  diagnosisCertainty: 'provisional' | 'confirmed',
  subjectReference: Reference,
  encounterReference: Reference,
  recorderReference: Reference,
  recordedDate: Date,
): Condition => {
  return {
    resourceType: 'Condition',
    subject: subjectReference,
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'encounter-diagnosis',
          },
        ],
      },
    ],
    code: createCodeableConcept([createCoding(diagnosisConceptUUID)]),
    verificationStatus: createCodeableConcept([
      createCoding(
        diagnosisCertainty,
        HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM,
      ),
    ]),
    encounter: encounterReference,
    recorder: recorderReference,
    recordedDate: recordedDate.toISOString(),
  };
};
