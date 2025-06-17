import { Condition, Reference } from 'fhir/r4';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';
import {
  HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM,
  HL7_CONDITION_CATEGORY_CONDITION_CODE,
  HL7_CONDITION_CLINICAL_STATUS_CODE_SYSTEM,
  HL7_CONDITION_CATEGORY_CODE_SYSTEM,
  HL7_CONDITION_CATEGORY_DIAGNOSIS_CODE,
} from '@constants/fhir';

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
            system: HL7_CONDITION_CATEGORY_CODE_SYSTEM,
            code: HL7_CONDITION_CATEGORY_DIAGNOSIS_CODE,
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

/**
 * Creates a FHIR R4 Condition resource for problem-list-item category
 * @param conditionConceptUUID - UUID of the condition concept
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param recorderReference - Reference to the practitioner
 * @param recordedDate - Date when condition was recorded
 * @param onsetDate - Onset date of the condition
 * @param clinicalStatus - Clinical status of condition (defaults to 'active')
 * @returns FHIR R4 Condition resource
 */
export const createEncounterConditionResource = (
  conditionConceptUUID: string,
  subjectReference: Reference,
  encounterReference: Reference,
  recorderReference: Reference,
  recordedDate: Date,
  onsetDate: Date,
  clinicalStatus: 'active' | 'inactive' = 'active',
): Condition => {
  return {
    resourceType: 'Condition',
    subject: subjectReference,
    category: [
      {
        coding: [
          {
            system: HL7_CONDITION_CATEGORY_CODE_SYSTEM,
            code: HL7_CONDITION_CATEGORY_CONDITION_CODE,
          },
        ],
      },
    ],
    code: createCodeableConcept([createCoding(conditionConceptUUID)]),
    clinicalStatus: createCodeableConcept([
      createCoding(
        clinicalStatus,
        HL7_CONDITION_CLINICAL_STATUS_CODE_SYSTEM,
      ),
    ]),
    encounter: encounterReference,
    recorder: recorderReference,
    recordedDate: recordedDate.toISOString(),
    onsetDateTime: onsetDate.toISOString(),
  };
};
