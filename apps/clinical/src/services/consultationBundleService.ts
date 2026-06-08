import {
  ConditionInputEntry,
  DiagnosisInputEntry,
  calculateOnsetDate,
  post,
  Form2Observation,
} from '@bahmni/services';
import { BundleEntry, Reference, Encounter } from 'fhir/r4';
import { CONSULTATION_BUNDLE_URL } from '../constants/app';
import { CONSULTATION_ERROR_MESSAGES } from '../constants/errors';
import { AllergyInputEntry } from '../models/allergy';
import { ConsultationBundle } from '../models/consultationBundle';
import { ServiceRequestInputEntry } from '../models/serviceRequest';
import { createEncounterAllergyResource } from '../utils/fhir/allergyResourceCreator';
import {
  createEncounterDiagnosisResource,
  createEncounterConditionResource,
} from '../utils/fhir/conditionResourceCreator';
import { createBundleEntry } from '../utils/fhir/consultationBundleCreator';
import { createObservationResources } from '../utils/fhir/observationResourceCreator';
import {
  createPractitionerReference,
  createEncounterReferenceFromString,
} from '../utils/fhir/referenceCreator';
import { createServiceRequestResource } from '../utils/fhir/serviceRequestResourceCreator';

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

interface CreateObservationBundleEntriesParams {
  observationFormsData: Record<string, Form2Observation[]>;
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

  if (!encounterSubject?.reference) {
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
    if (!diagnosis?.selectedCertainty?.code) {
      throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_DIAGNOSIS_PARAMS);
    }
    const diagnosisResourceURL = `urn:uuid:${crypto.randomUUID()}`;
    const diagnosisResource = createEncounterDiagnosisResource(
      diagnosis.id,
      diagnosis.selectedCertainty.code === 'confirmed'
        ? 'confirmed'
        : 'provisional',
      encounterSubject,
      createEncounterReferenceFromString(encounterReference),
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

  if (!encounterSubject?.reference) {
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
      !allergy?.selectedSeverity?.code ||
      !allergy.selectedReactions ||
      allergy.selectedReactions.length === 0
    ) {
      throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_ALLERGY_PARAMS);
    }

    const isExisting = !!allergy.resourceId && !!allergy.rawFhirResource;

    // Skip existing allergies that the user did not change.
    if (isExisting && !allergy.isModified) continue;

    const manifestationUUIDs = allergy.selectedReactions
      .filter((r): r is { code: string } => r.code !== undefined)
      .map((r) => r.code);
    const severity = allergy.selectedSeverity.code as
      | 'mild'
      | 'moderate'
      | 'severe';

    if (isExisting && allergy.rawFhirResource) {
      // Determine if the allergy belongs to the current encounter session.
      // encounterReference is the raw UUID (e.g. 'abc-123'); the server stores
      // the reference as 'Encounter/abc-123'. When no encounter is recorded on the
      // resource (legacy data), default to same-session to avoid unintended voids.
      const allergyEncounterRef = allergy.rawFhirResource.encounter?.reference;
      // encounterReference is already in 'Encounter/uuid' format (from getEncounterReference)
      // or a urn:uuid: placeholder for a brand-new encounter.
      const isSameSession =
        !allergyEncounterRef ||
        allergyEncounterRef === encounterReference;

      if (isSameSession) {
        // Same session: PUT to update the existing resource in place.
        // Rebuild manifestations, preserving the full FHIR structure (SNOMED codes
        // + text) for existing reactions and using minimal coding for new ones.
        const existingManifestationByCode = new Map<
          string,
          import('fhir/r4').CodeableConcept
        >();
        for (const r of allergy.rawFhirResource.reaction ?? []) {
          for (const m of r.manifestation ?? []) {
            const primaryCode = m.coding?.find((c) => !c.system)?.code;
            if (primaryCode && !existingManifestationByCode.has(primaryCode)) {
              existingManifestationByCode.set(primaryCode, m);
            }
          }
        }

        const seenCodes = new Set<string>();
        const manifestations = manifestationUUIDs
          .filter((code) => {
            if (seenCodes.has(code)) return false;
            seenCodes.add(code);
            return true;
          })
          .map(
            (code) =>
              existingManifestationByCode.get(code) ?? { coding: [{ code }] },
          );

        const putResource: import('fhir/r4').AllergyIntolerance = {
          ...allergy.rawFhirResource,
          encounter: createEncounterReferenceFromString(encounterReference),
          reaction: [
            {
              substance: allergy.rawFhirResource.code,
              manifestation: manifestations,
              severity,
            },
          ],
        };
        const putURL = `AllergyIntolerance/${allergy.resourceId}`;
        allergyEntries.push(createBundleEntry(putURL, putResource, 'PUT', putURL));
      } else {
        // Cross-session: the allergy belongs to a previous encounter.
        // Void the old resource and create a fresh one in the current session.
        const deleteURL = `AllergyIntolerance/${allergy.resourceId}`;
        allergyEntries.push(
          createBundleEntry(deleteURL, allergy.rawFhirResource, 'DELETE', deleteURL),
        );

        const newResource = createEncounterAllergyResource(
          allergy.id,
          [allergy.type] as Array<'food' | 'medication' | 'environment' | 'biologic'>,
          [{ manifestationUUIDs, severity }],
          encounterSubject,
          createEncounterReferenceFromString(encounterReference),
          createPractitionerReference(practitionerUUID),
          allergy.note,
        );
        allergyEntries.push(
          createBundleEntry(`urn:uuid:${crypto.randomUUID()}`, newResource, 'POST'),
        );
      }
    } else {
      // New allergy: POST.
      const newResource = createEncounterAllergyResource(
        allergy.id,
        [allergy.type] as Array<'food' | 'medication' | 'environment' | 'biologic'>,
        [{ manifestationUUIDs, severity }],
        encounterSubject,
        createEncounterReferenceFromString(encounterReference),
        createPractitionerReference(practitionerUUID),
        allergy.note,
      );
      allergyEntries.push(
        createBundleEntry(`urn:uuid:${crypto.randomUUID()}`, newResource, 'POST'),
      );
    }
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
  if (!encounterSubject?.reference) {
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
        createEncounterReferenceFromString(encounterReference),
        createPractitionerReference(practitionerUUID),
        serviceRequest.selectedPriority!,
        serviceRequest.note,
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

  if (!encounterSubject?.reference) {
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
      createEncounterReferenceFromString(encounterReference),
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

/**
 * Creates bundle entries for observations from observation forms as part of consultation bundle
 * @param params - Parameters required for creating observation bundle entries
 * @returns Array of BundleEntry for observations
 * @throws Error with specific message key for translation
 */
export function createObservationBundleEntries({
  observationFormsData,
  encounterSubject,
  encounterReference,
  practitionerUUID,
}: CreateObservationBundleEntriesParams): BundleEntry[] {
  if (!observationFormsData || typeof observationFormsData !== 'object') {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
  }

  if (!encounterSubject?.reference) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT);
  }

  if (!encounterReference) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_REFERENCE);
  }

  if (!practitionerUUID) {
    throw new Error(CONSULTATION_ERROR_MESSAGES.INVALID_PRACTITIONER);
  }

  const observationEntries: BundleEntry[] = [];

  // Iterate through all observation forms and their observations
  for (const formUuid in observationFormsData) {
    const observations = observationFormsData[formUuid];

    if (!observations || !Array.isArray(observations)) {
      continue;
    }

    // Create FHIR Observation resources from the observation payloads
    const observationResults = createObservationResources(
      observations,
      encounterSubject,
      createEncounterReferenceFromString(encounterReference),
      createPractitionerReference(practitionerUUID),
    );

    // Create bundle entries for each observation resource
    // Use the pre-generated fullUrl so hasMember references work correctly
    for (const result of observationResults) {
      const observationBundleEntry = createBundleEntry(
        result.fullUrl,
        result.resource,
        'POST',
      );
      observationEntries.push(observationBundleEntry);
    }
  }

  return observationEntries;
}

/**
 * Creates an encounter bundle entry that can handle both new (POST) and existing (PUT) encounters
 * @param activeEncounter - Existing encounter if editing, null if creating new
 * @param encounterResource - The encounter resource to include in bundle
 * @returns BundleEntry for the encounter
 */
export function createEncounterBundleEntry(
  activeEncounter: Encounter | null,
  encounterResource: Encounter,
): BundleEntry {
  // For existing encounters (PUT), use the full encounter URL as fullUrl
  // For new encounters (POST), use a placeholder UUID
  const fullUrl = activeEncounter
    ? `Encounter/${activeEncounter.id}`
    : `urn:uuid:${crypto.randomUUID()}`;

  const method = activeEncounter ? 'PUT' : 'POST';
  const resource = activeEncounter
    ? {
        ...encounterResource,
        id: activeEncounter.id,
      }
    : encounterResource;

  const resourceUrl = activeEncounter
    ? `Encounter/${activeEncounter.id}`
    : 'Encounter';

  return createBundleEntry(fullUrl, resource, method, resourceUrl);
}

/**
 * Gets the appropriate encounter reference for other resources
 * @param activeEncounter - Existing encounter if editing, null if creating new
 * @param placeholderReference - Placeholder reference for new encounters
 * @returns Reference string to use in other resources
 */
export function getEncounterReference(
  activeEncounter: Encounter | null,
  placeholderReference: string,
): string {
  return activeEncounter
    ? `Encounter/${activeEncounter.id}`
    : placeholderReference;
}

export async function postConsultationBundle<T>(
  consultationBundle: ConsultationBundle,
): Promise<T> {
  return await post<T>(CONSULTATION_BUNDLE_URL, consultationBundle);
}
