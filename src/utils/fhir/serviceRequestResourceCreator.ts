import { ServiceRequest, Reference } from 'fhir/r4';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';
import { SupportedServiceRequestPriority } from '@types/serviceRequest';

/**
 * Creates a FHIR ServiceRequest resource for an encounter
 * @param serviceConceptUUID - UUID of the service/procedure concept being requested
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param requesterReference - Reference to the practitioner requesting the service
 * @param priority - Priority of the request (routine, urgent, asap, stat)
 * @returns FHIR ServiceRequest resource
 */
export const createServiceRequestResource = (
  serviceConceptUUID: string,
  subjectReference: Reference,
  encounterReference: Reference,
  requesterReference: Reference,
  priority: SupportedServiceRequestPriority,
): ServiceRequest => {
  return {
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'order',
    priority: priority,
    code: createCodeableConcept([createCoding(serviceConceptUUID)]),
    subject: subjectReference,
    encounter: encounterReference,
    requester: requesterReference,
  };
};
