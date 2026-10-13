import type { DocumentEntry } from '../models';
import { createDocumentBundleEntries, createEmptyEntry } from '../utils';

const uploadedFile = (name: string, contentType: string) => ({
  id: `id-${name}`,
  file: new File(['x'], name, { type: contentType }),
  url: 'blob:preview',
  documentType: null,
  note: '',
  isNoteVisible: false,
  fileName: name,
  contentType,
  status: 'uploaded' as const,
  uploadedUrl: `100/${name}`,
});

const entry = (overrides: Partial<DocumentEntry> = {}): DocumentEntry => ({
  ...createEmptyEntry(),
  documentType: { id: 'type-uuid', label: 'Consent form' },
  documentId: ' DOC-1 ',
  note: ' signed ',
  files: [
    uploadedFile('a.png', 'image/png'),
    uploadedFile('b.pdf', 'application/pdf'),
  ],
  ...overrides,
});

const build = (entries: DocumentEntry[]) =>
  createDocumentBundleEntries({
    entries,
    encounterSubject: { reference: 'Patient/patient-uuid' },
    encounterReference: 'urn:uuid:encounter',
    practitionerUUID: 'practitioner-uuid',
  });

describe('createDocumentBundleEntries', () => {
  it('creates one DocumentReference per entry holding all its files', () => {
    const bundleEntries = build([entry(), entry()]);

    expect(bundleEntries).toHaveLength(2);
    const [first] = bundleEntries;
    expect(first.request).toEqual({ method: 'POST', url: 'DocumentReference' });
    expect(first.fullUrl).toMatch(/^urn:uuid:/);
    expect(first.resource).toMatchObject({
      resourceType: 'DocumentReference',
      subject: { reference: 'Patient/patient-uuid' },
      masterIdentifier: { value: 'DOC-1' },
      description: 'signed',
      type: { coding: [{ code: 'type-uuid', display: 'Consent form' }] },
      author: [{ reference: 'Practitioner/practitioner-uuid' }],
      context: { encounter: [{ reference: 'urn:uuid:encounter' }] },
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
    const [first, second] = build([entry(), entry()]);

    expect(first.fullUrl).not.toBe(second.fullUrl);
  });

  it('leaves out the identifier and note when blank', () => {
    const [{ resource }] = build([entry({ documentId: ' ', note: '' })]);

    expect(resource).not.toHaveProperty('masterIdentifier');
    expect(resource).not.toHaveProperty('description');
  });

  it('skips untouched entries and files that never finished uploading', () => {
    const pending = {
      ...uploadedFile('c.png', 'image/png'),
      uploadedUrl: undefined,
    };

    const bundleEntries = build([
      createEmptyEntry(),
      entry({ files: [uploadedFile('a.png', 'image/png'), pending] }),
    ]);

    expect(bundleEntries).toHaveLength(1);
    expect(
      (bundleEntries[0].resource as { content: unknown[] }).content,
    ).toHaveLength(1);
  });
});
