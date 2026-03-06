import { Bundle, DocumentReference } from 'fhir/r4';
import { get } from '../api';
import { PATIENT_DOCUMENT_REFERENCES_URL } from './constants';
import { DocumentViewModel } from './models';

/**
 * Maps FHIR DocumentReference entries to DocumentViewModel for UI consumption
 * @param entries - Array of FHIR Bundle entries containing DocumentReference resources
 * @returns Array of formatted DocumentViewModel objects
 */
function mapDocumentReferencesToViewModels(
  entries: Array<{ resource: DocumentReference }>,
): DocumentViewModel[] {
  return entries
    .filter((entry) => entry.resource?.resourceType === 'DocumentReference')
    .map((entry) => {
      const doc = entry.resource;
      const attachment = doc.content?.[0]?.attachment;
      const masterIdentifier = doc.masterIdentifier?.value ?? doc.id ?? '';

      return {
        id: doc.id ?? masterIdentifier,
        documentIdentifier: masterIdentifier,
        documentType:
          doc.type?.coding?.[0]?.display ??
          doc.category?.[0]?.coding?.[0]?.display,
        uploadedOn: doc.date ?? '',
        uploadedBy: doc.author?.[0]?.display,
        contentType: attachment?.contentType,
        documentUrl: attachment?.url ?? '',
      };
    });
}

/**
 * Fetches patient documents from the FHIR DocumentReference endpoint
 * Documents are sorted by date (latest first)
 * @param patientUuid - The UUID of the patient to fetch documents for
 * @param encounterUuids - Optional array of encounter UUIDs to filter documents
 * @returns Promise resolving to a FHIR Bundle containing DocumentReference resources
 */
export async function getDocumentReferences(
  patientUuid: string,
  encounterUuids?: string[],
): Promise<Bundle<DocumentReference>> {
  const url = PATIENT_DOCUMENT_REFERENCES_URL(patientUuid, encounterUuids);
  return get<Bundle<DocumentReference>>(url);
}

/**
 * Fetches and formats patient documents from the FHIR DocumentReference endpoint
 * Documents are sorted by date (latest first) and transformed to DocumentViewModel
 * @param patientUuid - The UUID of the patient to fetch documents for
 * @param encounterUuids - Optional array of encounter UUIDs to filter documents
 * @returns Promise resolving to an array of formatted DocumentViewModel objects
 */
export async function getFormattedDocumentReferences(
  patientUuid: string,
  encounterUuids?: string[],
): Promise<DocumentViewModel[]> {
  const bundle = await getDocumentReferences(patientUuid, encounterUuids);
  const entries = (bundle.entry ?? []).filter(
    (entry): entry is { resource: DocumentReference } => !!entry.resource,
  );
  return mapDocumentReferencesToViewModels(entries);
}
