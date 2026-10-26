import { Bundle, DocumentReference } from 'fhir/r4';
import { get } from '../api';
import {
  getConceptById,
  searchConceptByName,
} from '../conceptService/conceptService';
import type { ConceptData } from '../conceptService/models';
import {
  DOCUMENT_UPLOAD_MAX_SIZE_URL,
  PATIENT_DOCUMENT_REFERENCES_URL,
} from './constants';
import { DocumentType, DocumentViewModel } from './models';

export async function getDocumentUploadMaxSizeMb(): Promise<
  number | undefined
> {
  const response = await get<{ results: Array<{ value?: string }> }>(
    DOCUMENT_UPLOAD_MAX_SIZE_URL,
  );
  const value = Number(response.results?.[0]?.value);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

const DOCUMENT_TYPES_VIEW = 'custom:(setMembers:(uuid,display))';

const toDocumentTypes = (
  concept: Pick<ConceptData, 'setMembers'> | null,
): DocumentType[] =>
  (concept?.setMembers ?? []).map((member) => ({
    id: member.uuid,
    label: member.display ?? '',
  }));

export async function getDocumentTypes(
  conceptName: string,
): Promise<DocumentType[]> {
  return toDocumentTypes(
    await searchConceptByName(conceptName, DOCUMENT_TYPES_VIEW),
  );
}

export async function getDocumentTypesByConceptUuid(
  conceptUuid: string,
): Promise<DocumentType[]> {
  return toDocumentTypes(
    await getConceptById(conceptUuid, DOCUMENT_TYPES_VIEW),
  );
}

function mapDocumentReferencesToViewModels(
  entries: Array<{ resource: DocumentReference }>,
): DocumentViewModel[] {
  return entries
    .filter((entry) => entry.resource?.resourceType === 'DocumentReference')
    .map((entry) => {
      const doc = entry.resource;
      const masterIdentifier = doc.masterIdentifier?.value ?? '';
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

export async function getDocumentReferences(
  patientUuid: string,
  encounterUuids?: string[],
): Promise<Bundle<DocumentReference>> {
  const url = PATIENT_DOCUMENT_REFERENCES_URL(patientUuid, encounterUuids);
  return get<Bundle<DocumentReference>>(url);
}

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
