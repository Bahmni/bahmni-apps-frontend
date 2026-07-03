export interface DocumentTypeOption {
  id: string;
  label: string;
}

// Provide encounterUuid to reuse an existing encounter, or createEncounterInVisit to create one.
export type DocumentSaveTarget =
  | { encounterUuid: string }
  | {
      createEncounterInVisit: {
        visitUuid: string;
        encounterTypeUuid: string;
        encounterTypeDisplay?: string;
      };
    };

export interface DocumentUploadProps {
  patientUuid: string;
  encounterTypeName: string;
  saveTarget: DocumentSaveTarget;
  documentTypes?: DocumentTypeOption[];
  onSaved?: () => void;
}

// Uploaded (bytes stored, url returned) but not yet saved as a DocumentReference.
export interface PendingDocument {
  url: string;
  fileName: string;
  contentType: string;
}
