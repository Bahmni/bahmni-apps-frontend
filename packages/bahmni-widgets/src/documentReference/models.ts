import { Attachment } from 'fhir/r4';

export interface DocumentReferenceViewModel {
  readonly id: string;
  readonly attachment: Attachment[];
  readonly documentType: string;
  readonly masterIdentifier: string;
  readonly issuingDate: Date | null;
  readonly author: string;
  readonly expiryDate: Date | null;
  readonly attributes: Record<string, string | null>;
}
