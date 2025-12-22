import { ServiceRequest, Reference, Annotation } from 'fhir/r4';
import { SupportedServiceRequestPriority } from '../../models/serviceRequest';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';

/**
 * Creates a FHIR ServiceRequest resource for an encounter
 * @param serviceConceptUUID - UUID of the service/procedure concept being requested
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param requesterReference - Reference to the practitioner requesting the service
 * @param priority - Priority of the request (routine, urgent, asap, stat)
 * @param note
 * @returns FHIR ServiceRequest resource
 */
export const createServiceRequestResource = (
  serviceConceptUUID: string,
  subjectReference: Reference,
  encounterReference: Reference,
  requesterReference: Reference,
  priority: SupportedServiceRequestPriority,
  note?: string,
): ServiceRequest => {
  const resource: ServiceRequest = {
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'order',
    priority: priority,
    code: createCodeableConcept([createCoding(serviceConceptUUID)]),
    subject: subjectReference,
    encounter: encounterReference,
    requester: requesterReference,
  };

  if (note && note.trim() !== '') {
    resource.note = [{ text: note }] as Annotation[];
  }

  return resource;
};
