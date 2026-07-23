import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DocumentUpload } from '../DocumentUpload';
import { DocumentSaveTarget } from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  uploadDocument: jest.fn().mockResolvedValue({ url: 'patient/doc.png' }),
  saveDocument: jest.fn().mockResolvedValue({}),
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
  saveDocument,
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
      <DocumentUpload
        patientUuid="patient-uuid"
        encounterTypeName="Patient Document"
        saveTarget={saveTarget}
        documentTypes={[{ id: 'type-1', label: 'Lab Report' }]}
        onSaved={onSaved}
      />
    </QueryClientProvider>,
  );
};

const selectFile = (mimeType = 'image/png', sizeInBytes = 4) => {
  const input = screen.getByTestId('document-file-input');
  const file = new File([new Uint8Array(sizeInBytes)], 'doc.png', {
    type: mimeType,
  });
  fireEvent.change(input, { target: { files: [file] } });
};

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

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));
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

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));

    await waitFor(() =>
      expect(saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          patientUuid: 'patient-uuid',
          url: 'patient/doc.png',
          encounterUuid: 'encounter-uuid',
        }),
      ),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('shows a success notification after saving', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));

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

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));

    await waitFor(() =>
      expect(saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          patientUuid: 'patient-uuid',
          url: 'patient/doc.png',
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

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));
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

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));

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
    fireEvent.change(screen.getByTestId('document-note'), {
      target: { value: 'follow up in 2 weeks' },
    });
    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));

    await waitFor(() =>
      expect(saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'follow up in 2 weeks' }),
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
    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));

    await waitFor(() =>
      expect(saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          typeCode: 'type-1',
          typeDisplay: 'Lab Report',
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
    expect(saveDocument).not.toHaveBeenCalled();
  });

  it('keeps the pending selection and shows the backend error on save failure', async () => {
    saveDocument.mockRejectedValueOnce(new Error('Save rejected by server'));
    const onSaved = jest.fn();
    renderWidget(onSaved);
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));

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
    saveDocument.mockImplementation(async () => {
      callOrder.push('save');
      return {};
    });

    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));

    await waitFor(() => {
      expect(callOrder).toEqual(['upload', 'save']);
    });
  });

  it('updates pending URL from blob to server URL after upload', async () => {
    uploadDocument.mockResolvedValueOnce({ url: 'server/new-url.png' });
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));

    await waitFor(() =>
      expect(saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'server/new-url.png' }),
      ),
    );
  });

  it('does not call saveDocument if uploadDocument fails', async () => {
    uploadDocument.mockRejectedValueOnce(new Error('Upload failed'));
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));

    await waitFor(() => expect(uploadDocument).toHaveBeenCalled());
    expect(saveDocument).not.toHaveBeenCalled();
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

  it('dispatchs audit event with correct encounter type on successful save', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_SAVE'));

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
