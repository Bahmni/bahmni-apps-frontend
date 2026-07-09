import { Bundle, DocumentReference } from 'fhir/r4';
import { get } from '../api';
import { searchConceptByName } from '../conceptService/conceptService';
import {
  DOCUMENT_UPLOAD_MAX_SIZE_URL,
  PATIENT_DOCUMENT_REFERENCES_URL,
} from './constants';
import { DocumentType, DocumentViewModel } from './models';

/**
 * Reads the configured max document upload size (MB) from the
 * `bahmni.documentUpload.maxFileSizeInMB` system setting. Returns undefined when unset so callers
 * can fall back to their own default.
 */
export async function getDocumentUploadMaxSizeMb(): Promise<
  number | undefined
> {
  const response = await get<{ results: Array<{ value?: string }> }>(
    DOCUMENT_UPLOAD_MAX_SIZE_URL,
  );
  const value = Number(response.results?.[0]?.value);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Fetches the configurable document types (set members of the given document-type concept),
 * e.g. Prescription, Radiology Report. Used to populate the document-type dropdown.
 * @param conceptName - fully specified name of the document-type concept set
 */
export async function getDocumentTypes(
  conceptName: string,
): Promise<DocumentType[]> {
  const customView = 'custom:(setMembers:(uuid,display))';
  const concept = await searchConceptByName(conceptName, customView);
  return (concept?.setMembers ?? []).map((member) => ({
    id: member.uuid,
    label: member.display ?? '',
  }));
}

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
      const masterIdentifier = doc.masterIdentifier?.value ?? doc.id ?? '';
      const encounterId = doc.context?.encounter?.[0]?.reference
        ?.split('/')
        .pop();

      const attachments = (doc.content ?? [])
        .map((c) => c.attachment)
        .filter((a): a is NonNullable<typeof a> => !!a)
        .map((a) => ({ url: a.url ?? '', contentType: a.contentType }));

      const firstAttachment = attachments[0];

      return {
        id: doc.id ?? masterIdentifier,
        documentIdentifier: masterIdentifier,
        documentType:
          doc.type?.coding?.[0]?.display ??
          doc.category?.[0]?.coding?.[0]?.display,
        uploadedOn: doc.date ?? '',
        uploadedBy: doc.author?.[0]?.display,
        contentType: firstAttachment?.contentType,
        documentUrl: firstAttachment?.url ?? '',
        attachments,
        encounterId,
        description: doc.description,
      };
    });
}

/**
 * Fetches patient documents from the FHIR DocumentReference endpoint
 * The request includes _sort=-date; actual ordering depends on server support.
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
 * Returns documents transformed to DocumentViewModel; consumers are responsible
 * for client-side sorting where server-side _sort=-date is unsupported.
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

export interface DocumentReferencePage {
  documents: DocumentViewModel[];
  total: number;
}

/**
 * Fetches a single page of patient documents using offset-based pagination.
 * Uses _getpagesoffset = (page - 1) * count to jump directly to any page.
 * @param patientUuid - The UUID of the patient to fetch documents for
 * @param encounterUuids - Optional array of encounter UUIDs to filter documents
 * @param count - Number of items per page (default 10)
 * @param page - 1-based page number (default 1)
 * @returns Promise resolving to a DocumentReferencePage with documents and total count
 */
export async function getDocumentReferencePage(
  patientUuid: string,
  encounterUuids?: string[],
  count: number = 10,
  page: number = 1,
): Promise<DocumentReferencePage> {
  const offset = (page - 1) * count;
  const url = PATIENT_DOCUMENT_REFERENCES_URL(
    patientUuid,
    encounterUuids,
    count,
    offset,
  );
  const bundle = await get<Bundle<DocumentReference>>(url);

  const entries = (bundle.entry ?? []).filter(
    (entry): entry is { resource: DocumentReference } => !!entry.resource,
  );

  return {
    documents: mapDocumentReferencesToViewModels(entries),
    total: bundle.total ?? entries.length,
  };
}
