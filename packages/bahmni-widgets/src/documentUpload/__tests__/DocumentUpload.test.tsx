import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useRef, useState } from 'react';
import { DocumentUpload } from '../DocumentUpload';
import {
  DocumentSaveSummary,
  DocumentSaveTarget,
  DocumentUploadRef,
} from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  uploadDocument: jest.fn().mockResolvedValue({ url: 'patient/doc.png' }),
  saveDocuments: jest.fn().mockResolvedValue({}),
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

const mockPendingChange = jest.fn();

const Harness = ({
  onSaved,
  saveTarget,
}: {
  onSaved: () => void;
  saveTarget: DocumentSaveTarget;
}) => {
  const uploadRef = useRef<DocumentUploadRef>(null);
  const [summary, setSummary] = useState<DocumentSaveSummary | null>(null);
  return (
    <>
      <DocumentUpload
        ref={uploadRef}
        patientUuid="patient-uuid"
        encounterTypeName="Patient Document"
        saveTarget={saveTarget}
        documentTypes={[{ id: 'type-1', label: 'Lab Report' }]}
        onSaved={onSaved}
        onPendingChange={mockPendingChange}
      />
      <button
        data-testid="harness-save"
        onClick={async () =>
          setSummary((await uploadRef.current?.save()) ?? null)
        }
      >
        save
      </button>
      {summary && (
        <span data-testid="harness-summary">{JSON.stringify(summary)}</span>
      )}
    </>
  );
};

const savedSummary = async (): Promise<DocumentSaveSummary> =>
  JSON.parse((await screen.findByTestId('harness-summary')).textContent ?? '');

const renderWidget = (
  onSaved = jest.fn(),
  saveTarget: DocumentSaveTarget = EXISTING_ENCOUNTER_TARGET,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Harness onSaved={onSaved} saveTarget={saveTarget} />
    </QueryClientProvider>,
  );
};

const fileOf = (name: string, mimeType = 'image/png', sizeInBytes = 4) =>
  new File([new Uint8Array(sizeInBytes)], name, { type: mimeType });

const selectFiles = (...files: File[]) =>
  fireEvent.change(screen.getByTestId('document-file-input'), {
    target: { files },
  });

const selectFile = (mimeType = 'image/png', sizeInBytes = 4) =>
  selectFiles(fileOf('doc.png', mimeType, sizeInBytes));

describe('DocumentUpload', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the upload section', () => {
    renderWidget();
    expect(screen.getByText('DOCUMENT_UPLOAD_TITLE')).toBeInTheDocument();
    expect(screen.getByText('DOCUMENT_UPLOAD_BUTTON')).toBeInTheDocument();
  });

  it('creates pending blob on file select and uploads on save', async () => {
    renderWidget();
    selectFile();
    expect(
      await screen.findByTestId('pending-document-row'),
    ).toBeInTheDocument();
    expect(uploadDocument).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('harness-save'));
    await waitFor(() =>
      expect(uploadDocument).toHaveBeenCalledWith(
        expect.any(File),
        'Patient Document',
        'patient-uuid',
      ),
    );
  });

  it('leaves saving to the consumer instead of rendering its own save button', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    expect(screen.queryByText('DOCUMENT_UPLOAD_SAVE')).not.toBeInTheDocument();
  });

  it('reports the pending document to the consumer on select, discard and save', async () => {
    renderWidget();

    selectFile();
    await screen.findByTestId('pending-document-row');
    expect(mockPendingChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(screen.getByLabelText('DOCUMENT_UPLOAD_DISCARD'));
    expect(mockPendingChange).toHaveBeenLastCalledWith(false);

    selectFile();
    await screen.findByTestId('pending-document-row');
    fireEvent.click(screen.getByTestId('harness-save'));
    await waitFor(() =>
      expect(mockPendingChange).toHaveBeenLastCalledWith(false),
    );
  });

  it('does nothing when the consumer saves with no file selected', async () => {
    renderWidget();

    fireEvent.click(screen.getByTestId('harness-save'));

    await waitFor(() => expect(uploadDocument).not.toHaveBeenCalled());
    expect(saveDocuments).not.toHaveBeenCalled();
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

    fireEvent.click(screen.getByTestId('harness-save'));

    await waitFor(() =>
      expect(saveDocuments).toHaveBeenCalledWith({
        patientUuid: 'patient-uuid',
        target: EXISTING_ENCOUNTER_TARGET,
        documents: [expect.objectContaining({ url: 'patient/doc.png' })],
      }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('reports the save in its summary and raises no notification of its own', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByTestId('harness-save'));

    expect(await savedSummary()).toEqual({ savedCount: 1, failures: [] });
    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('passes the create-encounter save target through when no encounter exists yet', async () => {
    renderWidget(jest.fn(), CREATE_ENCOUNTER_TARGET);
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByTestId('harness-save'));

    await waitFor(() =>
      expect(saveDocuments).toHaveBeenCalledWith({
        patientUuid: 'patient-uuid',
        // The target travels once for the batch, not repeated on every document.
        target: CREATE_ENCOUNTER_TARGET,
        documents: [expect.objectContaining({ url: 'patient/doc.png' })],
      }),
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

    fireEvent.click(screen.getByTestId('harness-save'));
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

  it('reports the backend error verbatim and keeps the pending row when the upload fails', async () => {
    uploadDocument.mockRejectedValueOnce(new Error('File too large on server'));
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByTestId('harness-save'));

    expect(await savedSummary()).toEqual({
      savedCount: 0,
      failures: [{ fileName: 'doc.png', message: 'File too large on server' }],
    });
    expect(screen.queryByTestId('pending-document-row')).toBeInTheDocument();
  });

  it('adds the typed note as the description on save', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_ADD_NOTE'));
    fireEvent.change(screen.getByTestId('document-note'), {
      target: { value: 'follow up in 2 weeks' },
    });
    fireEvent.click(screen.getByTestId('harness-save'));

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
    fireEvent.click(screen.getByTestId('harness-save'));

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

  it('keeps the pending selection and reports the backend error on save failure', async () => {
    saveDocuments.mockRejectedValueOnce(new Error('Save rejected by server'));
    const onSaved = jest.fn();
    renderWidget(onSaved);
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByTestId('harness-save'));

    expect(await savedSummary()).toEqual({
      savedCount: 0,
      failures: [{ fileName: 'doc.png', message: 'Save rejected by server' }],
    });
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
    saveDocuments.mockImplementation(async () => {
      callOrder.push('save');
      return {};
    });

    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByTestId('harness-save'));

    await waitFor(() => {
      expect(callOrder).toEqual(['upload', 'save']);
    });
  });

  it('saves the metadata against the url the upload returned', async () => {
    uploadDocument.mockResolvedValueOnce({ url: 'server/new-url.png' });
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByTestId('harness-save'));

    await waitFor(() =>
      expect(saveDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: [expect.objectContaining({ url: 'server/new-url.png' })],
        }),
      ),
    );
  });

  it('does not call saveDocuments if uploadDocument fails', async () => {
    uploadDocument.mockRejectedValueOnce(new Error('Upload failed'));
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByTestId('harness-save'));

    await waitFor(() => expect(uploadDocument).toHaveBeenCalled());
    expect(saveDocuments).not.toHaveBeenCalled();
  });

  it('clears pending document when discard is clicked after file selection', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByLabelText('DOCUMENT_UPLOAD_DISCARD'));

    expect(
      screen.queryByTestId('pending-document-row'),
    ).not.toBeInTheDocument();
  });

  describe('multiple documents', () => {
    it('accepts several files at once and adds to what is already pending', async () => {
      renderWidget();

      selectFiles(fileOf('scan.png'), fileOf('report.pdf', 'application/pdf'));
      expect(await screen.findAllByTestId('pending-document-row')).toHaveLength(
        2,
      );

      selectFiles(fileOf('note.png'));
      expect(await screen.findAllByTestId('pending-document-row')).toHaveLength(
        3,
      );
      expect(uploadDocument).not.toHaveBeenCalled();
    });

    it('uploads and saves every pending document, each with its own note', async () => {
      renderWidget();
      selectFiles(fileOf('scan.png'), fileOf('report.pdf', 'application/pdf'));
      await screen.findAllByTestId('pending-document-row');

      fireEvent.click(screen.getAllByText('DOCUMENT_UPLOAD_ADD_NOTE')[1]);
      fireEvent.change(screen.getByTestId('document-note'), {
        target: { value: 'second file only' },
      });
      fireEvent.click(screen.getByTestId('harness-save'));

      expect(await savedSummary()).toEqual({ savedCount: 2, failures: [] });
      expect(uploadDocument).toHaveBeenCalledTimes(2);
      expect(saveDocuments).toHaveBeenCalledTimes(1);
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
      );
      expect(screen.queryAllByTestId('pending-document-row')).toHaveLength(0);
    });

    it('saves a batch in one transaction when the visit has no document encounter yet', async () => {
      renderWidget(jest.fn(), CREATE_ENCOUNTER_TARGET);
      selectFiles(fileOf('scan.png'), fileOf('report.pdf', 'application/pdf'));
      await screen.findAllByTestId('pending-document-row');

      fireEvent.click(screen.getByTestId('harness-save'));

      expect(await savedSummary()).toEqual({ savedCount: 2, failures: [] });
      // One call, so the batch shares a single new document encounter.
      expect(saveDocuments).toHaveBeenCalledTimes(1);
      expect(saveDocuments.mock.calls[0][0].documents).toEqual([
        expect.objectContaining({ title: 'scan.png' }),
        expect.objectContaining({ title: 'report.pdf' }),
      ]);
    });

    it('keeps only the documents that failed, and names them in the summary', async () => {
      uploadDocument
        .mockResolvedValueOnce({ url: 'patient/scan.png' })
        .mockRejectedValueOnce(new Error('Upload rejected'));
      const onSaved = jest.fn();
      renderWidget(onSaved);
      selectFiles(fileOf('scan.png'), fileOf('report.pdf', 'application/pdf'));
      await screen.findAllByTestId('pending-document-row');

      fireEvent.click(screen.getByTestId('harness-save'));

      expect(await savedSummary()).toEqual({
        savedCount: 1,
        failures: [{ fileName: 'report.pdf', message: 'Upload rejected' }],
      });
      expect(screen.getAllByTestId('pending-document-row')).toHaveLength(1);
      expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it('marks the whole batch failed when the single transaction is rejected', async () => {
      saveDocuments.mockRejectedValueOnce(new Error('Bundle rejected'));
      renderWidget(jest.fn(), CREATE_ENCOUNTER_TARGET);
      selectFiles(fileOf('scan.png'), fileOf('report.pdf', 'application/pdf'));
      await screen.findAllByTestId('pending-document-row');

      fireEvent.click(screen.getByTestId('harness-save'));

      // Atomic: nothing was written, so both stay pending.
      expect(await savedSummary()).toEqual({
        savedCount: 0,
        failures: [
          { fileName: 'scan.png', message: 'Bundle rejected' },
          { fileName: 'report.pdf', message: 'Bundle rejected' },
        ],
      });
      expect(screen.getAllByTestId('pending-document-row')).toHaveLength(2);
    });

    it('saves a batch against an existing encounter in one transaction too', async () => {
      renderWidget(jest.fn(), EXISTING_ENCOUNTER_TARGET);
      selectFiles(fileOf('scan.png'), fileOf('report.pdf', 'application/pdf'));
      await screen.findAllByTestId('pending-document-row');

      fireEvent.click(screen.getByTestId('harness-save'));

      expect(await savedSummary()).toEqual({ savedCount: 2, failures: [] });
      expect(saveDocuments).toHaveBeenCalledTimes(1);
      expect(saveDocuments.mock.calls[0][0].documents).toEqual([
        expect.objectContaining({ title: 'scan.png' }),
        expect.objectContaining({ title: 'report.pdf' }),
      ]);
    });

    it('fails an existing-encounter batch as a whole when the transaction is rejected', async () => {
      saveDocuments.mockRejectedValueOnce(new Error('Bundle rejected'));
      renderWidget(jest.fn(), EXISTING_ENCOUNTER_TARGET);
      selectFiles(fileOf('scan.png'), fileOf('report.pdf', 'application/pdf'));
      await screen.findAllByTestId('pending-document-row');

      fireEvent.click(screen.getByTestId('harness-save'));

      expect(await savedSummary()).toEqual({
        savedCount: 0,
        failures: [
          { fileName: 'scan.png', message: 'Bundle rejected' },
          { fileName: 'report.pdf', message: 'Bundle rejected' },
        ],
      });
      expect(screen.getAllByTestId('pending-document-row')).toHaveLength(2);
    });

    it('raises one notification per rejection reason, not per file', async () => {
      renderWidget();
      // Wait for the max-size setting so the size check is active.
      await screen.findByText(/DOCUMENT_UPLOAD_HELP/);

      selectFiles(
        fileOf('ok.png'),
        fileOf('huge.png', 'image/png', 6 * 1000 * 1000),
        fileOf('notes.txt', 'text/plain'),
      );

      expect(await screen.findAllByTestId('pending-document-row')).toHaveLength(
        1,
      );
      const titles = mockAddNotification.mock.calls.map(
        ([notification]) => notification.title,
      );
      expect(titles).toContain('DOCUMENT_UPLOAD_INVALID_TYPE_TITLE');
      expect(titles).toContain('DOCUMENT_UPLOAD_SIZE_EXCEEDED_TITLE');
      // One per reason, not one per rejected file.
      expect(titles).toHaveLength(2);
    });

    it('rejects unsupported files in a mixed selection with a single notification', async () => {
      renderWidget();

      selectFiles(
        fileOf('scan.png'),
        fileOf('notes.txt', 'text/plain'),
        fileOf('summary.doc', 'application/msword'),
      );

      expect(await screen.findAllByTestId('pending-document-row')).toHaveLength(
        1,
      );
      expect(mockAddNotification).toHaveBeenCalledTimes(1);
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'DOCUMENT_UPLOAD_INVALID_TYPE_TITLE',
          type: 'error',
        }),
      );
    });

    it('locks the type and note controls while the save is in flight', async () => {
      // Held open so the row is still on screen mid-save.
      let releaseUpload: (value: { url: string }) => void = () => {};
      uploadDocument.mockImplementationOnce(
        () =>
          new Promise<{ url: string }>((resolve) => {
            releaseUpload = resolve;
          }),
      );
      renderWidget();
      selectFile();
      await screen.findByTestId('pending-document-row');
      fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_ADD_NOTE'));

      fireEvent.click(screen.getByTestId('harness-save'));

      await waitFor(() =>
        expect(screen.getByTestId('document-note')).toBeDisabled(),
      );
      expect(screen.getByRole('combobox')).toBeDisabled();
      expect(screen.getByLabelText('DOCUMENT_UPLOAD_DISCARD')).toBeDisabled();
      expect(screen.getByText('DOCUMENT_UPLOAD_BUTTON')).toBeDisabled();

      await act(async () => releaseUpload({ url: 'patient/doc.png' }));
      await waitFor(() => expect(saveDocuments).toHaveBeenCalled());
    });

    it('reuses the stored bytes when retrying a failed save instead of uploading again', async () => {
      uploadDocument.mockResolvedValue({ url: 'patient/stored-once.png' });
      saveDocuments.mockRejectedValueOnce(new Error('Save rejected'));
      renderWidget();
      selectFile();
      await screen.findByTestId('pending-document-row');

      fireEvent.click(screen.getByTestId('harness-save'));
      expect(await savedSummary()).toEqual({
        savedCount: 0,
        failures: [{ fileName: 'doc.png', message: 'Save rejected' }],
      });
      expect(uploadDocument).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('harness-save'));

      await waitFor(() => expect(saveDocuments).toHaveBeenCalledTimes(2));
      expect(uploadDocument).toHaveBeenCalledTimes(1);
      expect(saveDocuments).toHaveBeenLastCalledWith(
        expect.objectContaining({
          documents: [
            expect.objectContaining({ url: 'patient/stored-once.png' }),
          ],
        }),
      );
    });

    it('discards one pending document without touching the others', async () => {
      renderWidget();
      selectFiles(fileOf('scan.png'), fileOf('report.pdf', 'application/pdf'));
      await screen.findAllByTestId('pending-document-row');

      fireEvent.click(screen.getAllByLabelText('DOCUMENT_UPLOAD_DISCARD')[0]);

      expect(screen.getAllByTestId('pending-document-row')).toHaveLength(1);
      expect(mockPendingChange).toHaveBeenLastCalledWith(true);
    });
  });

  it('dispatchs audit event with correct encounter type on successful save', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByTestId('harness-save'));

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
});
