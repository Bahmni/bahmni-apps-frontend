import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { DocumentUpload } from '../DocumentUpload';
import { DocumentSaveTarget } from '../models';
import { PendingDocumentsProvider } from '../PendingDocumentsProvider';
import { SaveDocumentsButton } from '../SaveDocumentsButton';

// Mirrors the service: every requested document saves unless a test overrides it.
const saveAll = async ({ documents }: { documents: unknown[] }) => ({
  savedIndices: documents.map((_, index) => index),
  failures: [],
});

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  uploadDocument: jest.fn().mockResolvedValue({ url: 'patient/doc.png' }),
  saveDocuments: jest.fn(),
  getDocumentUploadMaxSizeMb: jest.fn().mockResolvedValue(5),
  dispatchAuditEvent: jest.fn(),
}));

global.URL.createObjectURL = jest.fn(
  () => 'blob:http://localhost/test-blob-url',
);
global.URL.revokeObjectURL = jest.fn();

const mockAddNotification = jest.fn();
jest.mock('../../notification', () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

jest.mock('../../activePractitioner', () => ({
  useActivePractitioner: () => ({
    practitioner: { uuid: 'practitioner-uuid' },
  }),
}));

const {
  uploadDocument,
  saveDocuments,
  getDocumentUploadMaxSizeMb,
  dispatchAuditEvent,
} = jest.requireMock('@bahmni/services');

const EXISTING_ENCOUNTER_TARGET = { encounterUuid: 'encounter-uuid' };
const CREATE_ENCOUNTER_TARGET = {
  createEncounterInVisit: {
    visitUuid: 'visit-uuid',
    encounterTypeUuid: 'encounter-type-uuid',
    encounterTypeDisplay: 'Patient Document',
  },
};

const renderWidget = (
  onSaved = jest.fn(),
  saveTarget: DocumentSaveTarget = EXISTING_ENCOUNTER_TARGET,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PendingDocumentsProvider
        patientUuid="patient-uuid"
        encounterTypeName="Patient Document"
        documentTypes={[{ id: 'type-1', label: 'Lab Report' }]}
        onSaved={onSaved}
      >
        <DocumentUpload sourceId="visit-1" saveTarget={saveTarget} />
        <SaveDocumentsButton />
      </PendingDocumentsProvider>
    </QueryClientProvider>,
  );
};

const makeFile = (name: string, mimeType: string, sizeInBytes: number) =>
  new File([new Uint8Array(sizeInBytes)], name, { type: mimeType });

const selectFile = (mimeType = 'image/png', sizeInBytes = 4) => {
  const input = screen.getByTestId('document-file-input');
  fireEvent.change(input, {
    target: { files: [makeFile('doc.png', mimeType, sizeInBytes)] },
  });
};

const selectFiles = (files: File[]) => {
  const input = screen.getByTestId('document-file-input');
  fireEvent.change(input, { target: { files } });
};

const clickSave = () => fireEvent.click(screen.getByTestId('save-documents'));

describe('DocumentUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveDocuments.mockImplementation(saveAll);
    uploadDocument.mockResolvedValue({ url: 'patient/doc.png' });
  });

  it('renders the upload section', () => {
    renderWidget();
    expect(screen.getByText('DOCUMENT_UPLOAD_TITLE')).toBeInTheDocument();
    expect(screen.getByText('DOCUMENT_UPLOAD_BUTTON')).toBeInTheDocument();
  });

  it('has no save button of its own — saving is a page-level action', () => {
    renderWidget();
    selectFile();

    const uploadWidget = screen.getByText('DOCUMENT_UPLOAD_TITLE').parentElement
      ?.parentElement as HTMLElement;
    expect(
      within(uploadWidget).queryByTestId('save-documents'),
    ).not.toBeInTheDocument();
  });

  it('styles the save action like the upload button', () => {
    renderWidget();

    // Carbon encodes kind and size as classes; ignore the transient disabled state.
    const kindAndSize = (element: HTMLElement) =>
      Array.from(element.classList).filter(
        (name) =>
          name.startsWith('cds--btn--') && name !== 'cds--btn--disabled',
      );
    const upload = screen
      .getByText('DOCUMENT_UPLOAD_BUTTON')
      .closest('button') as HTMLElement;

    // Guards against both lists being empty, which would make the match meaningless.
    expect(kindAndSize(upload)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^cds--btn--/)]),
    );
    expect(kindAndSize(screen.getByTestId('save-documents'))).toEqual(
      kindAndSize(upload),
    );
  });

  it('keeps the save action disabled until a file is queued', async () => {
    renderWidget();
    expect(screen.getByTestId('save-documents')).toBeDisabled();

    selectFile();

    await waitFor(() =>
      expect(screen.getByTestId('save-documents')).toBeEnabled(),
    );
  });

  it('creates pending blob on file select and uploads on save', async () => {
    renderWidget();
    selectFile();
    expect(
      await screen.findByTestId('pending-document-row'),
    ).toBeInTheDocument();
    expect(uploadDocument).not.toHaveBeenCalled();

    clickSave();
    await waitFor(() =>
      expect(uploadDocument).toHaveBeenCalledWith(
        expect.any(File),
        'Patient Document',
        'patient-uuid',
      ),
    );
  });

  it('rejects unsupported file types without uploading', () => {
    renderWidget();
    selectFile('text/plain');
    expect(uploadDocument).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
    );
  });

  it('saves the document with the upload url and calls onSaved', async () => {
    const onSaved = jest.fn();
    renderWidget(onSaved);
    selectFile();
    await screen.findByTestId('pending-document-row');

    clickSave();

    await waitFor(() =>
      expect(saveDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          patientUuid: 'patient-uuid',
          encounterUuid: 'encounter-uuid',
          documents: [expect.objectContaining({ url: 'patient/doc.png' })],
        }),
      ),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('shows a success notification after saving', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    clickSave();

    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      ),
    );
  });

  it('passes the create-encounter save target through when no encounter exists yet', async () => {
    renderWidget(jest.fn(), CREATE_ENCOUNTER_TARGET);
    selectFile();
    await screen.findByTestId('pending-document-row');

    clickSave();

    await waitFor(() =>
      expect(saveDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          patientUuid: 'patient-uuid',
          createEncounterInVisit: {
            visitUuid: 'visit-uuid',
            encounterTypeUuid: 'encounter-type-uuid',
            encounterTypeDisplay: 'Patient Document',
          },
        }),
      ),
    );
  });

  it('shows the configured max size in the help text and rejects a larger file', async () => {
    renderWidget();
    // wait for the setting to load so the size check is active (help text shows the max-size line)
    await screen.findByText('DOCUMENT_UPLOAD_HELP');

    selectFile('image/png', 8 * 1024 * 1024);

    expect(uploadDocument).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
    );
  });

  it('does not enforce a size limit when the setting is not configured', async () => {
    getDocumentUploadMaxSizeMb.mockResolvedValueOnce(undefined);
    renderWidget();
    // no max-size line — only the supported-types help text
    await screen.findByText('DOCUMENT_UPLOAD_SUPPORTED_TYPES');

    selectFile('image/png', 8 * 1024 * 1024);
    await screen.findByTestId('pending-document-row');

    clickSave();
    await waitFor(() => expect(uploadDocument).toHaveBeenCalled());
  });

  it('renders a video tile for a video upload', async () => {
    renderWidget();
    selectFile('video/mp4');
    expect(
      await screen.findByTestId('pending-document-row'),
    ).toBeInTheDocument();
  });

  it('renders a file tile for a pdf upload', async () => {
    renderWidget();
    selectFile('application/pdf');
    expect(
      await screen.findByTestId('pending-document-row'),
    ).toBeInTheDocument();
  });

  it('shows the backend error verbatim and keeps pending row when the upload fails', async () => {
    uploadDocument.mockRejectedValueOnce(new Error('File too large on server'));
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    clickSave();

    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'File too large on server',
        }),
      ),
    );
    expect(screen.queryByTestId('pending-document-row')).toBeInTheDocument();
  });

  it('adds the typed note as the description on save', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_ADD_NOTE'));
    fireEvent.change(screen.getByTestId('document-note-0'), {
      target: { value: 'follow up in 2 weeks' },
    });
    clickSave();

    await waitFor(() =>
      expect(saveDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: [
            expect.objectContaining({ description: 'follow up in 2 weeks' }),
          ],
        }),
      ),
    );
  });

  it('defaults to the first document type and sends it on save', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    expect(
      screen.queryByText('DOCUMENT_UPLOAD_CHOOSE_TYPE'),
    ).not.toBeInTheDocument();
    clickSave();

    await waitFor(() =>
      expect(saveDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: [
            expect.objectContaining({
              typeCode: 'type-1',
              typeDisplay: 'Lab Report',
            }),
          ],
        }),
      ),
    );
  });

  it('discards the pending document when the discard button is clicked', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByLabelText('DOCUMENT_UPLOAD_DISCARD'));

    expect(
      screen.queryByTestId('pending-document-row'),
    ).not.toBeInTheDocument();
    expect(saveDocuments).not.toHaveBeenCalled();
  });

  it('keeps the pending selection and shows the backend error on save failure', async () => {
    saveDocuments.mockImplementation(async () => ({
      savedIndices: [],
      failures: [{ index: 0, error: new Error('Save rejected by server') }],
    }));
    const onSaved = jest.fn();
    renderWidget(onSaved);
    selectFile();
    await screen.findByTestId('pending-document-row');

    clickSave();

    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Save rejected by server',
        }),
      ),
    );
    // no data loss: the pending row is retained so the user can retry
    expect(screen.getByTestId('pending-document-row')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('uploads document before saving metadata', async () => {
    const callOrder: string[] = [];
    uploadDocument.mockImplementation(async () => {
      callOrder.push('upload');
      return { url: 'server/uploaded.png' };
    });
    saveDocuments.mockImplementation(
      async (input: { documents: unknown[] }) => {
        callOrder.push('save');
        return saveAll(input);
      },
    );

    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    clickSave();

    await waitFor(() => {
      expect(callOrder).toEqual(['upload', 'save']);
    });
  });

  it('saves the server url returned by the upload, not the local blob url', async () => {
    uploadDocument.mockResolvedValueOnce({ url: 'server/new-url.png' });
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    clickSave();

    await waitFor(() =>
      expect(saveDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: [expect.objectContaining({ url: 'server/new-url.png' })],
        }),
      ),
    );
  });

  it('does not save metadata if every upload fails', async () => {
    uploadDocument.mockRejectedValueOnce(new Error('Upload failed'));
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    clickSave();

    await waitFor(() => expect(uploadDocument).toHaveBeenCalled());
    expect(saveDocuments).not.toHaveBeenCalled();
  });

  it('dispatchs audit event with correct encounter type on successful save', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    clickSave();

    await waitFor(() =>
      expect(dispatchAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          patientUuid: 'patient-uuid',
          messageParams: { encounterType: 'Patient Document' },
          module: 'Patient Document',
        }),
      ),
    );
  });

  describe('multiple files', () => {
    const threeFiles = () => [
      makeFile('scan.png', 'image/png', 4),
      makeFile('report.pdf', 'application/pdf', 4),
      makeFile('clip.mp4', 'video/mp4', 4),
    ];

    it('adds a pending row per selected file', async () => {
      renderWidget();
      selectFiles(threeFiles());

      expect(await screen.findAllByTestId('pending-document-row')).toHaveLength(
        3,
      );
    });

    it('appends files selected in a later batch to the existing rows', async () => {
      renderWidget();
      selectFiles([makeFile('first.png', 'image/png', 4)]);
      await screen.findByTestId('pending-document-row');

      selectFiles([makeFile('second.png', 'image/png', 4)]);

      expect(await screen.findAllByTestId('pending-document-row')).toHaveLength(
        2,
      );
    });

    it('uploads every file and sends them all in one save call', async () => {
      renderWidget();
      selectFiles(threeFiles());
      await screen.findAllByTestId('pending-document-row');

      clickSave();

      await waitFor(() => expect(uploadDocument).toHaveBeenCalledTimes(3));
      // a single save keeps all three documents on one encounter
      expect(saveDocuments).toHaveBeenCalledTimes(1);
      expect(saveDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: [
            expect.objectContaining({ title: 'scan.png' }),
            expect.objectContaining({ title: 'report.pdf' }),
            expect.objectContaining({ title: 'clip.mp4' }),
          ],
        }),
      );
    });

    it('clears every row and reports the count once all files save', async () => {
      const onSaved = jest.fn();
      renderWidget(onSaved);
      selectFiles(threeFiles());
      await screen.findAllByTestId('pending-document-row');

      clickSave();

      await waitFor(() =>
        expect(screen.queryAllByTestId('pending-document-row')).toHaveLength(0),
      );
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: 'DOCUMENT_UPLOAD_SAVE_SUCCESS_MESSAGE_MULTIPLE',
        }),
      );
      expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it('keeps only the rows that failed to save', async () => {
      saveDocuments.mockImplementation(async () => ({
        savedIndices: [0, 2],
        failures: [{ index: 1, error: new Error('Save rejected by server') }],
      }));
      renderWidget();
      selectFiles(threeFiles());
      await screen.findAllByTestId('pending-document-row');

      clickSave();

      await waitFor(() =>
        expect(screen.queryAllByTestId('pending-document-row')).toHaveLength(1),
      );
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    it('skips unsupported files and keeps the valid ones in the list', async () => {
      renderWidget();
      selectFiles([
        makeFile('scan.png', 'image/png', 4),
        makeFile('notes.txt', 'text/plain', 4),
      ]);

      expect(await screen.findAllByTestId('pending-document-row')).toHaveLength(
        1,
      );
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      );
    });

    it('sends each row its own document type and note', async () => {
      renderWidget();
      selectFiles([
        makeFile('scan.png', 'image/png', 4),
        makeFile('report.pdf', 'application/pdf', 4),
      ]);
      await screen.findAllByTestId('pending-document-row');

      fireEvent.click(screen.getAllByText('DOCUMENT_UPLOAD_ADD_NOTE')[1]);
      fireEvent.change(screen.getByTestId('document-note-1'), {
        target: { value: 'second file only' },
      });
      clickSave();

      await waitFor(() =>
        expect(saveDocuments).toHaveBeenCalledWith(
          expect.objectContaining({
            documents: [
              expect.objectContaining({
                title: 'scan.png',
                description: undefined,
              }),
              expect.objectContaining({
                title: 'report.pdf',
                description: 'second file only',
              }),
            ],
          }),
        ),
      );
    });

    it('discards only the row whose discard button was clicked', async () => {
      renderWidget();
      selectFiles([
        makeFile('scan.png', 'image/png', 4),
        makeFile('report.pdf', 'application/pdf', 4),
      ]);
      await screen.findAllByTestId('pending-document-row');

      fireEvent.click(screen.getAllByLabelText('DOCUMENT_UPLOAD_DISCARD')[0]);

      expect(screen.queryAllByTestId('pending-document-row')).toHaveLength(1);
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    it('still saves the files that uploaded when one upload fails', async () => {
      uploadDocument
        .mockResolvedValueOnce({ url: 'server/scan.png' })
        .mockRejectedValueOnce(new Error('Upload failed'));
      renderWidget();
      selectFiles([
        makeFile('scan.png', 'image/png', 4),
        makeFile('report.pdf', 'application/pdf', 4),
      ]);
      await screen.findAllByTestId('pending-document-row');

      clickSave();

      await waitFor(() =>
        expect(saveDocuments).toHaveBeenCalledWith(
          expect.objectContaining({
            documents: [expect.objectContaining({ title: 'scan.png' })],
          }),
        ),
      );
      // the file that failed to upload stays behind for a retry
      await waitFor(() =>
        expect(screen.queryAllByTestId('pending-document-row')).toHaveLength(1),
      );
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });
  });
});
