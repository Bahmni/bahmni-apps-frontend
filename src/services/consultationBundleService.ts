import { post } from './api';
import { ConsultationBundle } from '@types/consultationBundle';
import { CONSULTATION_BUNDLE_URL } from '@constants/app';
import { BundleEntry, Reference } from 'fhir/r4';
import { CONSULTATION_ERROR_MESSAGES } from '@constants/errors';
import {
  createEncounterDiagnosisResource,
  createEncounterConditionResource,
} from '@utils/fhir/conditionResourceCreator';
import { createEncounterAllergyResource } from '@utils/fhir/allergyResourceCreator';
import { createBundleEntry } from '@utils/fhir/consultationBundleCreator';
import {
  createPractitionerReference,
  getPlaceholderReference,
} from '@utils/fhir/referenceCreator';
import { calculateOnsetDate } from '@utils/date';
import { DiagnosisInputEntry } from '@types/diagnosis';
import { AllergyInputEntry } from '@types/allergy';
import { ServiceRequestInputEntry } from '@types/serviceRequest';
import { createServiceRequestResource } from '@utils/fhir/serviceRequestResourceCreator';
import { ConditionInputEntry } from '@types/condition';
import { MedicationInputEntry } from '@types/medication';
import { createMedicationRequestResource } from '@utils/fhir/medicationRequestResourceCreator';

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

interface CreateConditionsBundleEntriesParams {
  selectedConditions: ConditionInputEntry[];
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
  consultationDate: Date;
}

interface CreateMedicationRequestBundleEntriesParams {
  selectedMedications: MedicationInputEntry[];
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

/**
 * Creates bundle entries for conditions as part of consultation bundle
 * @param params - Parameters required for creating condition bundle entries
 * @returns Array of BundleEntry for conditions
 * @throws Error with specific message key for translation
 */
export function createConditionsBundleEntries({
  selectedConditions,
  encounterSubject,
  encounterReference,
  practitionerUUID,
  consultationDate,
}: CreateConditionsBundleEntriesParams): BundleEntry[] {
  if (!selectedConditions || !Array.isArray(selectedConditions)) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
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

  if (selectedConditions.length === 0) {
    return [];
  }

  const conditionEntries: BundleEntry[] = [];

  for (const condition of selectedConditions) {
    if (
      !condition ||
      typeof condition.durationValue !== 'number' ||
      !condition.durationUnit ||
      condition.durationValue === null ||
      condition.durationUnit === null
    ) {
      throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
    }

    const onsetDate = calculateOnsetDate(
      consultationDate,
      condition.durationValue,
      condition.durationUnit,
    );

    const conditionResourceURL = `urn:uuid:${crypto.randomUUID()}`;
    const conditionResource = createEncounterConditionResource(
      condition.id,
      encounterSubject,
      getPlaceholderReference(encounterReference),
      createPractitionerReference(practitionerUUID),
      consultationDate,
      onsetDate!,
      'active',
    );

    const conditionBundleEntry = createBundleEntry(
      conditionResourceURL,
      conditionResource,
      'POST',
    );

    conditionEntries.push(conditionBundleEntry);
  }

  return conditionEntries;
}

export function createMedicationRequestEntries({
  selectedMedications,
  encounterSubject,
  encounterReference,
  practitionerUUID,
}: CreateMedicationRequestBundleEntriesParams): BundleEntry[] {
  if (!selectedMedications || !Array.isArray(selectedMedications)) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
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
  const medicationRequestEntries: BundleEntry[] = [];
  for (const medication of selectedMedications) {
    const medicationResourceURL = `urn:uuid:${crypto.randomUUID()}`;
    const medicationResource = createMedicationRequestResource(
      medication,
      encounterSubject,
      getPlaceholderReference(encounterReference),
      createPractitionerReference(practitionerUUID),
    );

    const medicationRequestEntry = createBundleEntry(
      medicationResourceURL,
      medicationResource,
      'POST',
    );

    medicationRequestEntries.push(medicationRequestEntry);
  }
  return medicationRequestEntries;
}

export async function postConsultationBundle<T>(
  consultationBundle: ConsultationBundle,
): Promise<T> {
  return await post<T>(CONSULTATION_BUNDLE_URL, consultationBundle);
}
