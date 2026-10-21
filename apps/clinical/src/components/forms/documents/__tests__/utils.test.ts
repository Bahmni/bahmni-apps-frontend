import type { DocumentEntry } from '@bahmni/widgets';
import { createDocumentBundleEntries } from '../utils';
import {
  CONSENT_FORM_TYPE,
  createBlankDocumentEntry,
  createDocumentEntry,
  createUploadedDocument,
  ENCOUNTER_REFERENCE,
  PATIENT_UUID,
  PRACTITIONER_UUID,
} from './__mocks__/documentsMocks';

const build = (entries: DocumentEntry[]) =>
  createDocumentBundleEntries({
    entries,
    encounterSubject: { reference: `Patient/${PATIENT_UUID}` },
    encounterReference: ENCOUNTER_REFERENCE,
    practitionerUUID: PRACTITIONER_UUID,
  });

describe('createDocumentBundleEntries', () => {
  it('creates one DocumentReference per entry holding all its files', () => {
    const bundleEntries = build([createDocumentEntry(), createDocumentEntry()]);

    expect(bundleEntries).toHaveLength(2);
    const [first] = bundleEntries;
    expect(first.request).toEqual({ method: 'POST', url: 'DocumentReference' });
    expect(first.fullUrl).toMatch(/^urn:uuid:/);
    expect(first.resource).toMatchObject({
      resourceType: 'DocumentReference',
      subject: { reference: `Patient/${PATIENT_UUID}` },
      masterIdentifier: { value: 'DOC-1' },
      description: 'signed',
      type: {
        coding: [
          { code: CONSENT_FORM_TYPE.id, display: CONSENT_FORM_TYPE.label },
        ],
      },
      author: [{ reference: `Practitioner/${PRACTITIONER_UUID}` }],
      context: { encounter: [{ reference: ENCOUNTER_REFERENCE }] },
      content: [
        {
          attachment: {
            url: '100/a.png',
            contentType: 'image/png',
            title: 'a.png',
          },
        },
        {
          attachment: {
            url: '100/b.pdf',
            contentType: 'application/pdf',
            title: 'b.pdf',
          },
        },
      ],
    });
  });

  it('gives every document its own placeholder url', () => {
    const [first, second] = build([
      createDocumentEntry(),
      createDocumentEntry(),
    ]);

    expect(first.fullUrl).not.toBe(second.fullUrl);
  });

  it('leaves out the identifier and note when blank', () => {
    const [{ resource }] = build([
      createDocumentEntry({ documentId: ' ', note: '' }),
    ]);

    expect(resource).not.toHaveProperty('masterIdentifier');
    expect(resource).not.toHaveProperty('description');
  });

  it('skips untouched entries and documents with a file that is not uploaded', () => {
    const notUploaded = {
      ...createUploadedDocument('c.png', 'image/png'),
      uploadedUrl: undefined,
    };

    const bundleEntries = build([
      createBlankDocumentEntry(),
      createDocumentEntry({
        files: [createUploadedDocument('a.png', 'image/png'), notUploaded],
      }),
      createDocumentEntry(),
    ]);

    expect(bundleEntries).toHaveLength(1);
    expect(
      (bundleEntries[0].resource as { content: unknown[] }).content,
    ).toHaveLength(2);
  });
});
