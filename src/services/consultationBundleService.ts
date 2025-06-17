import { post } from './api';
import { ConsultationBundle } from '@types/consultationBundle';
import { CONSULTATION_BUNDLE_URL } from '@constants/app';
import { BundleEntry, Reference } from 'fhir/r4';
import { CONSULTATION_ERROR_MESSAGES } from '@constants/errors';
import { createEncounterDiagnosisResource } from '@utils/fhir/conditionResourceCreator';
import { createEncounterAllergyResource } from '@utils/fhir/allergyResourceCreator';
import { createBundleEntry } from '@utils/fhir/consultationBundleCreator';
import {
  createPractitionerReference,
  getPlaceholderReference,
} from '@utils/fhir/referenceCreator';
import { DiagnosisInputEntry } from '@types/diagnosis';
import { AllergyInputEntry } from '@types/allergy';
import { ServiceRequestInputEntry } from '@types/serviceRequest';
import { createServiceRequestResource } from '@utils/fhir/serviceRequestResourceCreator';

interface CreateAllergiesBundleEntriesParams {
  selectedAllergies: AllergyInputEntry[];
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
}

interface CreateDiagnosisBundleEntriesParams {
  selectedDiagnoses: DiagnosisInputEntry[];
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
  consultationDate: Date;
}

interface CreateServiceRequestBundleEntriesParams {
  selectedServiceRequests: Map<string, ServiceRequestInputEntry[]>;
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
  consultationDate,
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
      consultationDate,
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
/**
 * Creates bundle entries for allergies as part of consultation bundle
 * @param params - Parameters required for creating allergy bundle entries
 * @returns Array of BundleEntry for allergies
 * @throws Error with specific message key for translation
 */
export function createAllergiesBundleEntries({
  selectedAllergies,
  encounterSubject,
  encounterReference,
  practitionerUUID,
}: CreateAllergiesBundleEntriesParams): BundleEntry[] {
  // Validate required parameters
  if (!selectedAllergies || !Array.isArray(selectedAllergies)) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_ALLERGY_PARAMS);
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

  const allergyEntries: BundleEntry[] = [];

  for (const allergy of selectedAllergies) {
    if (
      !allergy ||
      !allergy.selectedSeverity ||
      !allergy.selectedSeverity.code ||
      !allergy.selectedReactions ||
      allergy.selectedReactions.length === 0
    ) {
      throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_ALLERGY_PARAMS);
    }

    const allergyResourceURL = `urn:uuid:${crypto.randomUUID()}`;
    const allergyResource = createEncounterAllergyResource(
      allergy.id,
      [allergy.type] as Array<
        'food' | 'medication' | 'environment' | 'biologic'
      >,
      [
        {
          manifestationUUIDs: allergy.selectedReactions
            .filter(
              (reaction): reaction is { code: string } =>
                reaction.code !== undefined,
            )
            .map((reaction) => reaction.code),
          severity: allergy.selectedSeverity.code as
            | 'mild'
            | 'moderate'
            | 'severe',
        },
      ],
      encounterSubject,
      getPlaceholderReference(encounterReference),
      createPractitionerReference(practitionerUUID),
    );

    const allergyBundleEntry = createBundleEntry(
      allergyResourceURL,
      allergyResource,
      'POST',
    );

    allergyEntries.push(allergyBundleEntry);
  }

  return allergyEntries;
}

export function createServiceRequestBundleEntries({
  selectedServiceRequests,
  encounterSubject,
  encounterReference,
  practitionerUUID,
}: CreateServiceRequestBundleEntriesParams): BundleEntry[] {
  const serviceRequestEntries: BundleEntry[] = [];
  if (!encounterSubject || !encounterSubject.reference) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT);
  }

  if (!encounterReference) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_REFERENCE);
  }

  if (!practitionerUUID) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_PRACTITIONER);
  }
  selectedServiceRequests.forEach((serviceRequests) => {
    if (!serviceRequests || serviceRequests.length === 0) {
      return;
    }
    for (const serviceRequest of serviceRequests) {
      const resourceURL = `urn:uuid:${crypto.randomUUID()}`;
      const resource = createServiceRequestResource(
        serviceRequest.id,
        encounterSubject,
        getPlaceholderReference(encounterReference),
        createPractitionerReference(practitionerUUID),
        serviceRequest.selectedPriority,
      );
      const serviceRequestEntry = createBundleEntry(
        resourceURL,
        resource,
        'POST',
      );
      serviceRequestEntries.push(serviceRequestEntry);
    }
  });
  return serviceRequestEntries;
}

export async function postConsultationBundle<T>(
  consultationBundle: ConsultationBundle,
): Promise<T> {
  return await post<T>(CONSULTATION_BUNDLE_URL, consultationBundle);
}
