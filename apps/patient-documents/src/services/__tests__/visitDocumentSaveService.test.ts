import type { PendingDocument } from '@bahmni/widgets';
import { saveVisitDocuments } from '../visitDocumentSaveService';

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

const pending = (
  fileName: string,
  overrides: Partial<PendingDocument> = {},
): PendingDocument => ({
  id: `pending-${fileName}`,
  file: new File([new Uint8Array(4)], fileName, { type: 'image/png' }),
  url: `blob:http://localhost/${fileName}`,
  fileName,
  contentType: 'image/png',
  documentType: null,
  note: '',
  isNoteVisible: false,
  ...overrides,
});

const save = (
  documents: PendingDocument[],
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

describe('saveVisitDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadDocument.mockImplementation(async (file: File) => ({
      url: `patient/${file.name}`,
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

    const result = await save([pending('doc.png')]);

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
          url: 'server/new-url.png',
          contentType: 'image/png',
          title: 'doc.png',
          typeCode: 'type-1',
          typeDisplay: 'Lab Report',
          description: undefined,
          authorPractitionerUuid: 'practitioner-uuid',
        },
      ],
    });
    expect(result).toEqual({
      savedIds: ['pending-doc.png'],
      uploadedUrls: { 'pending-doc.png': 'server/new-url.png' },
      failures: [],
    });
  });

  it('passes the create-encounter save target through when no encounter exists yet', async () => {
    await save([pending('doc.png')], CREATE_ENCOUNTER_TARGET);

    expect(saveDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ target: CREATE_ENCOUNTER_TARGET }),
    );
  });

  it('sends the trimmed note as the description and the chosen type over the default', async () => {
    await save([
      pending('doc.png', {
        note: '  follow up in 2 weeks ',
        documentType: { id: 'type-2', label: 'Prescription' },
      }),
    ]);

    expect(saveDocuments.mock.calls[0][0].documents).toEqual([
      expect.objectContaining({
        description: 'follow up in 2 weeks',
        typeCode: 'type-2',
        typeDisplay: 'Prescription',
      }),
    ]);
  });

  it('saves a batch in one transaction, each document with its own note', async () => {
    const result = await save(
      [pending('scan.png'), pending('report.pdf', { note: 'second only' })],
      CREATE_ENCOUNTER_TARGET,
    );

    expect(uploadDocument).toHaveBeenCalledTimes(2);
    // One call, so the batch shares a single new document encounter.
    expect(saveDocuments).toHaveBeenCalledTimes(1);
    expect(saveDocuments.mock.calls[0][0].documents).toEqual([
      expect.objectContaining({ title: 'scan.png', description: undefined }),
      expect.objectContaining({
        title: 'report.pdf',
        description: 'second only',
      }),
    ]);
    expect(result.savedIds).toEqual(['pending-scan.png', 'pending-report.pdf']);
  });

  it('fails only the document whose upload failed, and saves the rest', async () => {
    uploadDocument
      .mockResolvedValueOnce({ url: 'patient/scan.png' })
      .mockRejectedValueOnce(new Error('Upload rejected'));

    const result = await save([pending('scan.png'), pending('report.pdf')]);

    expect(saveDocuments.mock.calls[0][0].documents).toEqual([
      expect.objectContaining({ title: 'scan.png' }),
    ]);
    expect(result).toEqual({
      savedIds: ['pending-scan.png'],
      uploadedUrls: { 'pending-scan.png': 'patient/scan.png' },
      failures: [{ fileName: 'report.pdf', message: 'Upload rejected' }],
    });
  });

  it('does not save when every upload failed', async () => {
    uploadDocument.mockRejectedValueOnce(new Error('File too large on server'));

    const result = await save([pending('doc.png')]);

    expect(saveDocuments).not.toHaveBeenCalled();
    expect(result).toEqual({
      savedIds: [],
      uploadedUrls: {},
      failures: [{ fileName: 'doc.png', message: 'File too large on server' }],
    });
  });

  it.each([
    ['existing encounter', EXISTING_ENCOUNTER_TARGET],
    ['new encounter', CREATE_ENCOUNTER_TARGET],
  ])(
    'fails the whole %s batch when the transaction is rejected, keeping the upload urls',
    async (_, target) => {
      saveDocuments.mockRejectedValueOnce(new Error('Bundle rejected'));

      const result = await save(
        [pending('scan.png'), pending('report.pdf')],
        target,
      );

      // Atomic: nothing was written, so neither is saved.
      expect(result).toEqual({
        savedIds: [],
        uploadedUrls: {
          'pending-scan.png': 'patient/scan.png',
          'pending-report.pdf': 'patient/report.pdf',
        },
        failures: [
          { fileName: 'scan.png', message: 'Bundle rejected' },
          { fileName: 'report.pdf', message: 'Bundle rejected' },
        ],
      });
      expect(dispatchAuditEvent).not.toHaveBeenCalled();
    },
  );

  it('reuses the stored upload when retrying instead of uploading again', async () => {
    await save([
      pending('doc.png', { uploadedUrl: 'patient/stored-once.png' }),
    ]);

    expect(uploadDocument).not.toHaveBeenCalled();
    expect(saveDocuments.mock.calls[0][0].documents).toEqual([
      expect.objectContaining({ url: 'patient/stored-once.png' }),
    ]);
  });

  it('dispatches an audit event per saved document with the encounter type', async () => {
    await save([pending('scan.png'), pending('report.pdf')]);

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
