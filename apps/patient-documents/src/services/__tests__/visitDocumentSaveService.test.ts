import {
  DocumentSaveFile,
  DocumentSaveInput,
  saveVisitDocuments,
} from '../visitDocumentSaveService';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  uploadDocument: jest.fn(),
  saveDocuments: jest.fn(),
  dispatchAuditEvent: jest.fn(),
}));

const { uploadDocument, saveDocuments, dispatchAuditEvent } =
  jest.requireMock('@bahmni/services');

const EXISTING_ENCOUNTER_TARGET = {
  encounterUuid: 'encounter-uuid',
  existingEncounter: {
    resourceType: 'Encounter' as const,
    id: 'encounter-uuid',
    status: 'finished' as const,
    subject: { reference: 'Patient/patient-uuid' },
    partOf: { reference: 'Encounter/visit-uuid' },
  },
};
const CREATE_ENCOUNTER_TARGET = {
  createEncounterInVisit: {
    visitUuid: 'visit-uuid',
    encounterTypeUuid: 'encounter-type-uuid',
    encounterTypeDisplay: 'Patient Document',
  },
};
const LAB_REPORT = { id: 'type-1', label: 'Lab Report' };
const PRESCRIPTION = { id: 'type-2', label: 'Prescription' };

const file = (
  fileName: string,
  overrides: Partial<DocumentSaveFile> = {},
): DocumentSaveFile => ({
  id: `file-${fileName}`,
  file: new File([new Uint8Array(4)], fileName, { type: 'image/png' }),
  fileName,
  contentType: 'image/png',
  ...overrides,
});

const document = (
  id: string,
  files: DocumentSaveFile[],
  overrides: Partial<DocumentSaveInput> = {},
): DocumentSaveInput => ({
  id,
  files,
  documentType: null,
  note: '',
  ...overrides,
});

const save = (
  documents: DocumentSaveInput[],
  target:
    | typeof EXISTING_ENCOUNTER_TARGET
    | typeof CREATE_ENCOUNTER_TARGET = EXISTING_ENCOUNTER_TARGET,
) =>
  saveVisitDocuments({
    patientUuid: 'patient-uuid',
    encounterTypeName: 'Patient Document',
    target,
    documents,
    defaultDocumentType: LAB_REPORT,
    authorPractitionerUuid: 'practitioner-uuid',
  });

const savedDocuments = () => saveDocuments.mock.calls[0][0].documents;

describe('saveVisitDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadDocument.mockImplementation(async (uploaded: File) => ({
      url: `patient/${uploaded.name}`,
    }));
    saveDocuments.mockResolvedValue({});
  });

  it('uploads the bytes, then saves the metadata against the url the upload returned', async () => {
    const callOrder: string[] = [];
    uploadDocument.mockImplementationOnce(async () => {
      callOrder.push('upload');
      return { url: 'server/new-url.png' };
    });
    saveDocuments.mockImplementationOnce(async () => {
      callOrder.push('save');
      return {};
    });

    const result = await save([document('doc-1', [file('doc.png')])]);

    expect(callOrder).toEqual(['upload', 'save']);
    expect(uploadDocument).toHaveBeenCalledWith(
      expect.any(File),
      'Patient Document',
      'patient-uuid',
    );
    expect(saveDocuments).toHaveBeenCalledWith({
      patientUuid: 'patient-uuid',
      target: EXISTING_ENCOUNTER_TARGET,
      documents: [
        {
          files: [
            {
              url: 'server/new-url.png',
              contentType: 'image/png',
              title: 'doc.png',
            },
          ],
          typeCode: 'type-1',
          typeDisplay: 'Lab Report',
          description: undefined,
          authorPractitionerUuid: 'practitioner-uuid',
        },
      ],
    });
    expect(result).toEqual({
      savedIds: ['doc-1'],
      uploadedUrls: { 'file-doc.png': 'server/new-url.png' },
      failures: [],
    });
  });

  it('saves several files as a single document under one type and note', async () => {
    const result = await save([
      document('doc-1', [file('a.png'), file('b.png'), file('c.png')], {
        documentType: PRESCRIPTION,
        note: '  three pages  ',
      }),
    ]);

    expect(uploadDocument).toHaveBeenCalledTimes(3);
    expect(savedDocuments()).toHaveLength(1);
    expect(savedDocuments()[0]).toMatchObject({
      typeCode: 'type-2',
      typeDisplay: 'Prescription',
      description: 'three pages',
    });
    expect(
      savedDocuments()[0].files.map((f: { title: string }) => f.title),
    ).toEqual(['a.png', 'b.png', 'c.png']);
    expect(result.savedIds).toEqual(['doc-1']);
  });

  it('falls back to the default type when none was chosen', async () => {
    await save([document('doc-1', [file('a.png')])]);

    expect(savedDocuments()[0]).toMatchObject({
      typeCode: 'type-1',
      typeDisplay: 'Lab Report',
    });
  });

  it('saves a batch of documents in one transaction, each with its own type and note', async () => {
    await save(
      [
        document('doc-1', [file('scan.png')]),
        document('doc-2', [file('report.pdf')], {
          documentType: PRESCRIPTION,
          note: 'second only',
        }),
      ],
      CREATE_ENCOUNTER_TARGET,
    );

    expect(uploadDocument).toHaveBeenCalledTimes(2);
    expect(saveDocuments).toHaveBeenCalledTimes(1);
    expect(saveDocuments.mock.calls[0][0].target).toEqual(
      CREATE_ENCOUNTER_TARGET,
    );
    expect(savedDocuments()).toEqual([
      expect.objectContaining({
        files: [expect.objectContaining({ title: 'scan.png' })],
        description: undefined,
      }),
      expect.objectContaining({
        files: [expect.objectContaining({ title: 'report.pdf' })],
        typeCode: 'type-2',
        description: 'second only',
      }),
    ]);
  });

  it('leaves a document unsaved when any of its files fails to upload, and saves the rest', async () => {
    uploadDocument.mockImplementation(async (uploaded: File) => {
      if (uploaded.name === 'b.png') throw new Error('Upload rejected');
      return { url: `patient/${uploaded.name}` };
    });

    const result = await save([
      document('doc-1', [file('a.png'), file('b.png')]),
      document('doc-2', [file('c.png')]),
    ]);

    expect(savedDocuments()).toEqual([
      expect.objectContaining({
        files: [expect.objectContaining({ title: 'c.png' })],
      }),
    ]);
    expect(result).toEqual({
      savedIds: ['doc-2'],
      // The file of the unsaved document that did upload is remembered, so a retry skips it.
      uploadedUrls: {
        'file-a.png': 'patient/a.png',
        'file-c.png': 'patient/c.png',
      },
      failures: [{ fileName: 'b.png', message: 'Upload rejected' }],
    });
  });

  it('does not save when every upload failed', async () => {
    uploadDocument.mockRejectedValue(new Error('Upload rejected'));

    const result = await save([document('doc-1', [file('a.png')])]);

    expect(saveDocuments).not.toHaveBeenCalled();
    expect(result).toEqual({
      savedIds: [],
      uploadedUrls: {},
      failures: [{ fileName: 'a.png', message: 'Upload rejected' }],
    });
  });

  it('reuses the stored upload when retrying instead of uploading again', async () => {
    await save([
      document('doc-1', [
        file('a.png', { uploadedUrl: 'patient/stored-once.png' }),
        file('b.png'),
      ]),
    ]);

    expect(uploadDocument).toHaveBeenCalledTimes(1);
    expect(uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'b.png' }),
      'Patient Document',
      'patient-uuid',
    );
    expect(savedDocuments()[0].files[0].url).toBe('patient/stored-once.png');
  });

  it.each([
    ['existing encounter', EXISTING_ENCOUNTER_TARGET],
    ['new encounter', CREATE_ENCOUNTER_TARGET],
  ])(
    'fails the whole %s batch when the transaction is rejected, keeping the upload urls',
    async (_label, target) => {
      saveDocuments.mockRejectedValue(new Error('Bundle rejected'));

      const result = await save(
        [
          document('doc-1', [file('a.png'), file('b.png')]),
          document('doc-2', [file('c.png')]),
        ],
        target,
      );

      expect(result.savedIds).toEqual([]);
      expect(result.uploadedUrls).toEqual({
        'file-a.png': 'patient/a.png',
        'file-b.png': 'patient/b.png',
        'file-c.png': 'patient/c.png',
      });
      expect(result.failures).toEqual([
        { fileName: 'a.png', message: 'Bundle rejected' },
        { fileName: 'b.png', message: 'Bundle rejected' },
        { fileName: 'c.png', message: 'Bundle rejected' },
      ]);
      expect(dispatchAuditEvent).not.toHaveBeenCalled();
    },
  );

  it('dispatches an audit event per saved document with the encounter type', async () => {
    await save([
      document('doc-1', [file('a.png'), file('b.png')]),
      document('doc-2', [file('c.png')]),
    ]);

    expect(dispatchAuditEvent).toHaveBeenCalledTimes(2);
    expect(dispatchAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        patientUuid: 'patient-uuid',
        messageParams: { encounterType: 'Patient Document' },
        module: 'Patient Document',
      }),
    );
  });
});
