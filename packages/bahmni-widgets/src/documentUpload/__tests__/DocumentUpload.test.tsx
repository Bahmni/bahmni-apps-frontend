import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { DocumentUpload } from '../DocumentUpload';
import { PendingDocument } from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  uploadDocument: jest.fn(),
  saveDocuments: jest.fn(),
  getDocumentUploadMaxSizeMb: jest.fn().mockResolvedValue(5),
}));

global.URL.createObjectURL = jest.fn(
  () => 'blob:http://localhost/test-blob-url',
);
global.URL.revokeObjectURL = jest.fn();

const mockAddNotification = jest.fn();
jest.mock('../../notification', () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

const { uploadDocument, saveDocuments, getDocumentUploadMaxSizeMb } =
  jest.requireMock('@bahmni/services');

const mockDocumentsChange = jest.fn();

const Harness = ({ isSaving = false }: { isSaving?: boolean }) => {
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  return (
    <DocumentUpload
      documents={documents}
      onDocumentsChange={(next) => {
        mockDocumentsChange(next);
        setDocuments(next);
      }}
      documentTypes={[
        { id: 'type-1', label: 'Lab Report' },
        { id: 'type-2', label: 'Prescription' },
      ]}
      isSaving={isSaving}
    />
  );
};

const queryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWidget = () => {
  const client = queryClient();
  const view = render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  );
  const setSaving = (isSaving: boolean) =>
    view.rerender(
      <QueryClientProvider client={client}>
        <Harness isSaving={isSaving} />
      </QueryClientProvider>,
    );
  return { ...view, setSaving };
};

const lastDocuments = (): PendingDocument[] =>
  mockDocumentsChange.mock.calls.at(-1)?.[0] ?? [];

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

  it('hands a selected file to the consumer as a pending document without uploading it', async () => {
    renderWidget();
    selectFile();

    expect(
      await screen.findByTestId('pending-document-row'),
    ).toBeInTheDocument();
    expect(lastDocuments()).toEqual([
      expect.objectContaining({
        file: expect.any(File),
        fileName: 'doc.png',
        contentType: 'image/png',
        url: 'blob:http://localhost/test-blob-url',
        documentType: null,
        note: '',
      }),
    ]);
    expect(uploadDocument).not.toHaveBeenCalled();
    expect(saveDocuments).not.toHaveBeenCalled();
  });

  it('leaves saving to the consumer instead of rendering its own save button', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    expect(screen.queryByText('DOCUMENT_UPLOAD_SAVE')).not.toBeInTheDocument();
  });

  it('rejects unsupported file types without adding them', () => {
    renderWidget();
    selectFile('text/plain');

    expect(mockDocumentsChange).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', timeout: 5000 }),
    );
  });

  it('shows the configured max size in the help text and rejects a larger file', async () => {
    renderWidget();
    // wait for the setting to load so the size check is active (help text shows the max-size line)
    await screen.findByText('DOCUMENT_UPLOAD_HELP');

    selectFile('image/png', 8 * 1024 * 1024);

    expect(mockDocumentsChange).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', timeout: 5000 }),
    );
  });

  it('does not enforce a size limit when the setting is not configured', async () => {
    getDocumentUploadMaxSizeMb.mockResolvedValueOnce(undefined);
    renderWidget();
    // no max-size line — only the supported-types help text
    await screen.findByText('DOCUMENT_UPLOAD_SUPPORTED_TYPES');

    selectFile('image/png', 8 * 1024 * 1024);

    expect(
      await screen.findByTestId('pending-document-row'),
    ).toBeInTheDocument();
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

  it('records the typed note on the pending document', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_ADD_NOTE'));
    fireEvent.change(screen.getByTestId('document-note'), {
      target: { value: 'follow up in 2 weeks' },
    });

    expect(lastDocuments()).toEqual([
      expect.objectContaining({
        note: 'follow up in 2 weeks',
        isNoteVisible: true,
      }),
    ]);
  });

  it('shows the first document type by default without fixing it on the document', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    expect(
      screen.queryByText('DOCUMENT_UPLOAD_CHOOSE_TYPE'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Lab Report')).toBeInTheDocument();
    // Left unset so the consumer resolves the default at save time, after the types have loaded.
    expect(lastDocuments()[0].documentType).toBeNull();
  });

  it('discards the pending document and releases its preview', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByLabelText('DOCUMENT_UPLOAD_DISCARD'));

    expect(
      screen.queryByTestId('pending-document-row'),
    ).not.toBeInTheDocument();
    expect(lastDocuments()).toEqual([]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      'blob:http://localhost/test-blob-url',
    );
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
      expect(lastDocuments().map((document) => document.fileName)).toEqual([
        'scan.png',
        'report.pdf',
        'note.png',
      ]);
    });

    it('gives every pending document its own id', async () => {
      renderWidget();

      selectFiles(fileOf('scan.png'), fileOf('report.pdf', 'application/pdf'));
      selectFiles(fileOf('note.png'));
      await screen.findAllByTestId('pending-document-row');

      const ids = lastDocuments().map((document) => document.id);
      expect(new Set(ids).size).toBe(3);
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

    it('locks the type and note controls while the consumer is saving', async () => {
      const { setSaving } = renderWidget();
      selectFile();
      await screen.findByTestId('pending-document-row');
      fireEvent.click(screen.getByText('DOCUMENT_UPLOAD_ADD_NOTE'));

      setSaving(true);

      expect(screen.getByTestId('document-note')).toBeDisabled();
      expect(screen.getByRole('combobox')).toBeDisabled();
      expect(screen.getByLabelText('DOCUMENT_UPLOAD_DISCARD')).toBeDisabled();
      expect(screen.getByText('DOCUMENT_UPLOAD_BUTTON')).toBeDisabled();
      expect(screen.getByText('DOCUMENT_UPLOAD_SAVING')).toBeInTheDocument();

      setSaving(false);

      expect(screen.getByTestId('document-note')).toBeEnabled();
    });

    it('discards one pending document without touching the others', async () => {
      renderWidget();
      selectFiles(fileOf('scan.png'), fileOf('report.pdf', 'application/pdf'));
      await screen.findAllByTestId('pending-document-row');

      fireEvent.click(screen.getAllByLabelText('DOCUMENT_UPLOAD_DISCARD')[0]);

      expect(screen.getAllByTestId('pending-document-row')).toHaveLength(1);
      expect(lastDocuments().map((document) => document.fileName)).toEqual([
        'report.pdf',
      ]);
    });
  });
});
