import { Bundle, DocumentReference } from 'fhir/r4';
import { get, post, put } from '../api';
import {
  DOCUMENT_REFERENCE_BY_PATIENT_URL,
  DOCUMENT_REFERENCE_URL,
} from './constants';

export async function getDocumentReferenceBundleByPatient(
  patientUUID: string,
): Promise<Bundle> {
  return await get<Bundle>(`${DOCUMENT_REFERENCE_BY_PATIENT_URL(patientUUID)}`);
}

export async function getDocumentReferencesByPatient(
  patientUuid: string,
): Promise<DocumentReference[]> {
  const bundle = await getDocumentReferenceBundleByPatient(patientUuid);
  const documentReferences: DocumentReference[] =
    bundle.entry?.map((entry) => entry.resource as DocumentReference) ?? [];
  return documentReferences;
}

export async function createDocumentReference(
  body: DocumentReference,
): Promise<DocumentReference> {
  return await post<DocumentReference>(DOCUMENT_REFERENCE_URL, body);
}

export async function updateDocumentReference(
  body: DocumentReference,
): Promise<DocumentReference> {
  return await put<DocumentReference>(DOCUMENT_REFERENCE_URL, body);
}
