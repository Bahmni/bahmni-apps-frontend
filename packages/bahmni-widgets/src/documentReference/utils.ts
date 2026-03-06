import { camelToScreamingSnakeCase } from '@bahmni/services';
import { parseISO } from 'date-fns';
import { DocumentReference } from 'fhir/r4';
import { ATTRIBUTE_REGEX_KEY, KNOWN_FIELDS } from './constants';
import { DocumentReferenceViewModel } from './models';

export function extractDocumentReferenceAttributeNames(
  fields?: string[],
): string[] {
  if (!fields) return [];
  return fields.filter((field) => !KNOWN_FIELDS.includes(field));
}

export function createDocumentReferenceHeaders(
  fields: string[],
  t: (key: string) => string,
): Array<{ key: string; header: string }> {
  return fields.map((field) => ({
    key: field,
    header: t(
      `DOCUMENT_REFERENCE_TABLE_HEADER_${camelToScreamingSnakeCase(field)}`,
    ),
  }));
}

function kebabToCamelCase(str: string): string {
  return str.replaceAll(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function extractDocumentReferenceAttributes(
  documentReference: DocumentReference,
): Record<string, string> {
  if (!documentReference.extension) return {};
  const attributes: Record<string, string> = {};
  documentReference.extension.forEach((ext) => {
    if (ext.url?.includes(ATTRIBUTE_REGEX_KEY)) {
      const attributeName = ext.url.split(ATTRIBUTE_REGEX_KEY)[1];
      if (attributeName) {
        // TODO: Handle different value types that FHIR extensions can have
        attributes[kebabToCamelCase(attributeName)] = ext.valueString ?? '-';
      }
    }
  });
  return attributes;
}

export function mapDocumentReferenceToDisplayData(
  docReference: DocumentReference,
): DocumentReferenceViewModel {
  const documentType = docReference.type!.text!;
  const masterIdentifier = docReference.masterIdentifier
    ? docReference.masterIdentifier.value!
    : '-';
  const attachment = docReference.content.map((content) => content.attachment);
  const issuingDate = docReference.context?.period?.start
    ? parseISO(docReference.context?.period?.start)
    : null;
  const expiryDate = docReference.context?.period?.end
    ? parseISO(docReference.context?.period?.end)
    : null;
  const attributes = extractDocumentReferenceAttributes(docReference);
  const author =
    docReference.author
      ?.map((author) => author.display)
      .filter((display): display is string => !!display)
      .join(', ') ?? '-';
  return {
    id: docReference.id!,
    attachment,
    documentType,
    masterIdentifier,
    author,
    issuingDate,
    expiryDate,
    attributes,
  };
}
