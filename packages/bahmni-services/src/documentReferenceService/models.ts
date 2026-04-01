/**
 * Interface representing a single attachment within a document
 */
export interface Attachment {
  readonly url: string;
  readonly contentType?: string;
}

/**
 * Interface representing a formatted document for easier consumption by components
 */
export interface DocumentViewModel {
  readonly id: string;
  readonly documentIdentifier: string;
  readonly documentType?: string;
  readonly uploadedOn: string;
  readonly uploadedBy?: string;
  readonly contentType?: string;
  readonly documentUrl: string;
  readonly attachments: Attachment[];
}
