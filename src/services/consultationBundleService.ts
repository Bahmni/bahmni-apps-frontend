import { post } from './api';
import { ConsultationBundle } from '@types/consultationBundle';
import { CONSULTATION_BUNDLE_URL } from '@constants/app';

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

/**
 * Creates a consultation bundle payload with the given parameters
 * @param patientUUID - UUID of the patient
 * @param practitionerUUID - UUID of the practitioner
 * @param parentEncounterUUID - UUID of the parent encounter
 * @param locationUUID - UUID of the location
 * @param encounterTypeUUID - UUID of the encounter type
 * @param encounterTypeDisplay - Display name of the encounter type
 * @returns A properly formatted consultation bundle
 */
export function createConsultationBundlePayload(
  patientUUID: string,
  practitionerUUID: string,
  parentEncounterUUID: string,
  locationUUID: string,
  encounterTypeUUID: string,
  encounterTypeDisplay: string,
): ConsultationBundle {
  const timestamp = new Date().toISOString();
  const encounterUUID = crypto.randomUUID();
  const consultationBundleID = crypto.randomUUID();
  const patientReference = `Patient/${patientUUID}`;
  const practitionerReference = `Practitioner/${practitionerUUID}`;
  const parentEncounterReference = `Encounter/${parentEncounterUUID}`;
  const locationReference = `Location/${locationUUID}`;

  return {
    resourceType: 'ConsultationBundle',
    id: consultationBundleID,
    type: 'transaction',
    timestamp: timestamp,
    entry: [
      {
        fullUrl: `urn:uuid:${encounterUUID}`,
        resource: {
          resourceType: 'Encounter',
          identifier: [
            {
              use: 'temp',
              value: encounterUUID,
            },
          ],
          status: 'in-progress',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'AMB',
            display: 'ambulatory',
          },
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
            {
              coding: [
                {
                  system: 'http://fhir.openmrs.org/code-system/encounter-type',
                  code: encounterTypeUUID,
                  display: encounterTypeDisplay,
                },
              ],
            },
          ],
          subject: {
            reference: patientReference,
          },
          participant: [
            {
              individual: {
                reference: practitionerReference,
                type: 'Practitioner',
              },
            },
          ],
          partOf: {
            reference: parentEncounterReference,
          },
          location: [
            {
              location: {
                reference: locationReference,
              },
            },
          ],
          period: {
            start: timestamp,
          },
        },
        request: {
          method: 'POST',
          url: 'Encounter',
        },
      },
    ],
  };
}
