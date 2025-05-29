import { post } from './api';
import { ConsultationBundle } from '@types/consultationBundle';
import { CONSULTATION_BUNDLE_URL } from '@constants/app';
import { BundleEntry, Reference } from 'fhir/r4';
import { CONSULTATION_ERROR_MESSAGES } from '@constants/errors';
import { createEncounterDiagnosisResource } from '@utils/fhir/conditionResourceCreator';
import { createBundleEntry } from '@utils/fhir/consultationBundleCreator';
import {
  createPractitionerReference,
  getPlaceholderReference,
} from '@utils/fhir/referenceCreator';
import { DiagnosisInputEntry } from '@types/diagnosis';

interface CreateDiagnosisBundleEntriesParams {
  selectedDiagnoses: DiagnosisInputEntry[];
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
}

/**
 * Creates bundle entries for diagnoses as part of consultation bundle
 * @param params - Parameters required for creating diagnosis bundle entries
 * @returns Array of BundleEntry for diagnoses
 * @throws Error with specific message key for translation
 */
export function createDiagnosisBundleEntries({
  selectedDiagnoses,
  encounterSubject,
  encounterReference,
  practitionerUUID,
}: CreateDiagnosisBundleEntriesParams): BundleEntry[] {
  // Validate required parameters
  if (!selectedDiagnoses || !Array.isArray(selectedDiagnoses)) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_DIAGNOSIS_PARAMS);
  }

  if (!encounterSubject || !encounterSubject.reference) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT);
  }

  if (!encounterReference) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_REFERENCE);
  }

  if (!practitionerUUID) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_PRACTITIONER);
  }

  const diagnosisEntries: BundleEntry[] = [];

  for (const diagnosis of selectedDiagnoses) {
    if (
      !diagnosis ||
      !diagnosis.selectedCertainty ||
      !diagnosis.selectedCertainty.code
    ) {
      throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_DIAGNOSIS_PARAMS);
    }
    const diagnosisResourceURL = `urn:uuid:${crypto.randomUUID()}`;
    const diagnosisResource = createEncounterDiagnosisResource(
      diagnosis.id,
      diagnosis.selectedCertainty.code === 'confirmed'
        ? 'confirmed'
        : 'provisional',
      encounterSubject,
      getPlaceholderReference(encounterReference),
      createPractitionerReference(practitionerUUID),
      new Date(),
    );
    const diagnosisBundleEntry = createBundleEntry(
      diagnosisResourceURL,
      diagnosisResource,
      'POST',
    );

    diagnosisEntries.push(diagnosisBundleEntry);
  }

  return diagnosisEntries;
}

/**
 * Posts a consultation bundle to the FHIR R4 endpoint
 * @param consultationBundle - The consultation bundle payload
 * @returns Promise resolving to the response data
 */
export async function postConsultationBundle<T>(
  consultationBundle: ConsultationBundle,
): Promise<T> {
  return await post<T>(CONSULTATION_BUNDLE_URL, consultationBundle);
}
