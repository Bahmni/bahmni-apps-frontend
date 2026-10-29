import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { DocumentUpload } from '../DocumentUpload';
import { DocumentEntry, DocumentUploadProps, PendingDocument } from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getDocumentUploadMaxSizeMb: jest.fn(),
  getDocumentTypes: jest.fn(),
  getDocumentTypesByConceptUuid: jest.fn(),
}));

global.URL.createObjectURL = jest.fn(
  () => 'blob:http://localhost/test-blob-url',
);
global.URL.revokeObjectURL = jest.fn();

const mockAddNotification = jest.fn();
jest.mock('../../notification', () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

const {
  getDocumentUploadMaxSizeMb,
  getDocumentTypes,
  getDocumentTypesByConceptUuid,
} = jest.requireMock('@bahmni/services');

const TYPES = [
  { id: 'type-1', label: 'Lab Report' },
  { id: 'type-2', label: 'Prescription' },
];

const pendingFile = (
  name: string,
  extra: Partial<PendingDocument> = {},
): PendingDocument => ({
  id: `pending-${name}`,
  file: new File(['x'], name, { type: 'image/png' }),
  url: `blob:http://localhost/${name}`,
  fileName: name,
  contentType: 'image/png',
  ...extra,
});

const entry = (
  id: string,
  extra: Partial<DocumentEntry> = {},
): DocumentEntry => ({
  id,
  documentType: null,
  documentId: '',
  note: '',
  files: [],
  errors: {},
  ...extra,
});

const fileOf = (name: string, type = 'image/png', sizeInBytes = 4) =>
  new File([new Uint8Array(sizeInBytes)], name, { type });

const METADATA = { documentTypeConceptName: 'Document Type' };
const DOC_ID_CONFIG = {
  attributes: [{ name: 'documentId' }],
  metadata: METADATA,
};
const TYPE_REQUIRED_CONFIG = {
  attributes: [{ name: 'documentType', required: true }],
  metadata: METADATA,
};

const DEFAULT_CONFIG = {
  attributes: [{ name: 'documentType', required: false }],
  metadata: METADATA,
};

const onChange = jest.fn();

type HarnessProps = Partial<
  Omit<DocumentUploadProps, 'documents' | 'onDocumentsChange'>
> & { initial?: DocumentEntry[] };

const Harness = ({ initial = [entry('e1')], ...props }: HarnessProps) => {
  const [documents, setDocuments] = useState<DocumentEntry[]>(initial);
  return (
    <DocumentUpload
      config={DEFAULT_CONFIG}
      {...props}
      documents={documents}
      onDocumentsChange={(next) => {
        onChange(next);
        setDocuments(next);
      }}
    />
  );
};

const renderWidget = (props: HarnessProps = {}, strict = false) => {
  const widget = (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Harness {...props} />
    </QueryClientProvider>
  );
  return render(strict ? <StrictMode>{widget}</StrictMode> : widget);
};

const latest = (): DocumentEntry[] => onChange.mock.calls.at(-1)?.[0];

const fileInputs = () =>
  Array.from(document.querySelectorAll<HTMLInputElement>('input[type="file"]'));

const pick = (index: number, ...files: File[]) =>
  fireEvent.change(fileInputs()[index], { target: { files } });

describe('DocumentUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDocumentUploadMaxSizeMb.mockResolvedValue(5);
    getDocumentTypes.mockResolvedValue(TYPES);
    getDocumentTypesByConceptUuid.mockResolvedValue(TYPES);
  });

  describe('documents', () => {
    it('shows an empty document to start from when it is given none', () => {
      renderWidget({ initial: [] });

      expect(screen.getAllByTestId(/^document-entry-/)).toHaveLength(1);
      expect(latest()).toEqual([expect.objectContaining({ files: [] })]);
    });

    it('still starts with a single empty document when effects run twice on mount', () => {
      renderWidget({ initial: [] }, true);

      expect(screen.getAllByTestId(/^document-entry-/)).toHaveLength(1);
      expect(latest()).toHaveLength(1);
    });

    it('adds another document with "Add more"', () => {
      renderWidget();

      fireEvent.click(screen.getByTestId('document-upload-add-more'));

      expect(screen.getAllByTestId(/^document-entry-/)).toHaveLength(2);
      expect(latest()).toHaveLength(2);
    });

    it('offers removal only when there is more than one document, and releases previews', () => {
      renderWidget({
        initial: [entry('e1', { files: [pendingFile('a.png')] }), entry('e2')],
      });

      fireEvent.click(screen.getAllByRole('button', { name: /close/i })[0]);

      expect(screen.getAllByTestId(/^document-entry-/)).toHaveLength(1);
      expect(latest().map(({ id }) => id)).toEqual(['e2']);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(
        'blob:http://localhost/a.png',
      );
      expect(screen.queryByRole('button', { name: /close/i })).toBeNull();
    });

    it('lists the documents under a heading when given one', () => {
      renderWidget({ documentsTitle: 'Added document type' });

      expect(screen.getByText('Added document type')).toBeVisible();
    });

    it('locks the controls while saving', () => {
      renderWidget({ isSaving: true, config: DOC_ID_CONFIG });

      expect(screen.getByRole('combobox')).toBeDisabled();
      expect(screen.getByTestId('document-id-e1')).toBeDisabled();
      expect(screen.getByTestId('document-upload-add-more')).toBeDisabled();
      expect(fileInputs()[0]).toBeDisabled();
    });
  });

  describe('type and identifier', () => {
    it('shows no Document ID by default, and keeps the type dropdown narrow then', () => {
      renderWidget();

      expect(screen.queryByTestId('document-id-e1')).toBeNull();
      expect(
        screen.getByTestId('document-type-e1').closest('.typeOnly'),
      ).not.toBeNull();
    });

    it('shows the Document ID when asked to and records what is typed', () => {
      renderWidget({ config: DOC_ID_CONFIG });

      fireEvent.change(screen.getByTestId('document-id-e1'), {
        target: { value: 'D-2' },
      });

      expect(latest()[0].documentId).toBe('D-2');
      expect(
        screen.getByTestId('document-type-e1').closest('.typeOnly'),
      ).toBeNull();
    });

    it('marks the type as required only when it is', () => {
      const { unmount } = renderWidget({ config: TYPE_REQUIRED_CONFIG });
      expect(screen.getByText('DOCUMENTS_DOCUMENT_TYPE_LABEL*')).toBeVisible();
      unmount();

      renderWidget();
      expect(screen.getByText('DOCUMENTS_DOCUMENT_TYPE_LABEL')).toBeVisible();
    });

    it('records the type that is chosen', async () => {
      renderWidget();

      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(await screen.findByText('Lab Report'));

      expect(latest()[0].documentType).toEqual(TYPES[0]);
    });

    it('shows the errors it is given, and clears one when its field is corrected', () => {
      renderWidget({
        config: DOC_ID_CONFIG,
        initial: [
          entry('e1', {
            errors: {
              documentType: 'TYPE_ERROR',
              documentId: 'ID_ERROR',
              files: 'FILES_ERROR',
            },
          }),
        ],
      });
      expect(screen.getByText('TYPE_ERROR')).toBeVisible();
      expect(screen.getByText('ID_ERROR')).toBeVisible();
      expect(screen.getByText('FILES_ERROR')).toBeVisible();

      fireEvent.change(screen.getByTestId('document-id-e1'), {
        target: { value: 'D-1' },
      });

      expect(latest()[0].errors.documentId).toBeUndefined();
      expect(latest()[0].errors.documentType).toBe('TYPE_ERROR');
    });
  });

  describe('note', () => {
    it('opens from "Add note", records typing, and clears when closed', () => {
      renderWidget();
      expect(screen.queryByTestId('document-note-e1')).toBeNull();

      fireEvent.click(screen.getByTestId('document-add-note-e1'));
      fireEvent.change(screen.getByTestId('document-note-e1'), {
        target: { value: 'signed' },
      });
      expect(latest()[0].note).toBe('signed');

      fireEvent.click(screen.getByRole('button', { name: /close|clear/i }));

      expect(latest()[0].note).toBe('');
      expect(screen.getByTestId('document-add-note-e1')).toBeInTheDocument();
    });

    it('shows an existing note without needing to open it', () => {
      renderWidget({ initial: [entry('e1', { note: 'already here' })] });

      expect(screen.getByTestId('document-note-e1')).toHaveValue(
        'already here',
      );
    });
  });

  describe('files', () => {
    it('adds accepted files to the document they were picked for', async () => {
      renderWidget({ initial: [entry('e1'), entry('e2')] });
      await screen.findAllByText('DOCUMENT_UPLOAD_MAX_SIZE');

      pick(1, fileOf('a.png'), fileOf('b.pdf', 'application/pdf'));

      expect(latest()[0].files).toEqual([]);
      expect(latest()[1].files.map((file) => file.fileName)).toEqual([
        'a.png',
        'b.pdf',
      ]);
      expect(await screen.findByText('a.png')).toBeInTheDocument();
    });

    it('rejects files outside the configured extensions and notifies', () => {
      renderWidget({
        config: { metadata: { ...METADATA, supportedFileTypes: ['.pdf'] } },
      });

      pick(0, fileOf('a.png'));

      expect(onChange).not.toHaveBeenCalled();
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'DOCUMENT_UPLOAD_INVALID_TYPE_TITLE',
        }),
      );
    });

    it('restricts the file picker to the configured extensions', () => {
      renderWidget({
        config: {
          metadata: { ...METADATA, supportedFileTypes: ['pdf', '.PNG'] },
        },
      });

      expect(fileInputs()[0]).toHaveAttribute('accept', '.pdf,.png');
    });

    it('rejects a file over the configured size limit', async () => {
      renderWidget();
      await screen.findByText('DOCUMENT_UPLOAD_MAX_SIZE');

      pick(0, fileOf('big.png', 'image/png', 6 * 1000 * 1000));

      expect(onChange).not.toHaveBeenCalled();
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'DOCUMENT_UPLOAD_SIZE_EXCEEDED_TITLE',
        }),
      );
    });

    it('removes a file and releases its preview', () => {
      renderWidget({
        initial: [
          entry('e1', { files: [pendingFile('a.png'), pendingFile('b.png')] }),
        ],
      });

      fireEvent.click(
        screen.getAllByRole('button', {
          name: /DOCUMENT_UPLOAD_REMOVE_FILE/,
        })[0],
      );

      expect(latest()[0].files.map((file) => file.fileName)).toEqual(['b.png']);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(
        'blob:http://localhost/a.png',
      );
    });

    it('shows a thumbnail beside each file: the image itself, or a document icon for anything else', () => {
      renderWidget({
        initial: [
          entry('e1', {
            files: [
              pendingFile('scan.png'),
              pendingFile('report.pdf', { contentType: 'application/pdf' }),
              pendingFile('clip.mp4', { contentType: 'video/mp4' }),
              pendingFile('notes.bin', {
                contentType: 'application/octet-stream',
              }),
            ],
          }),
        ],
      });

      const thumbnails = Array.from(
        document.querySelectorAll('[class*="thumbnail"]'),
      );
      expect(thumbnails).toHaveLength(4);
      expect(thumbnails[0].querySelector('img')).toHaveAttribute(
        'src',
        'blob:http://localhost/scan.png',
      );
      thumbnails
        .slice(1)
        .forEach((thumbnail) =>
          expect(thumbnail.querySelector('svg')).not.toBeNull(),
        );
      expect(thumbnails[1].querySelector('img')).toBeNull();
    });

    it('shows a failed upload with its reason, and no removal while uploading', () => {
      renderWidget({
        initial: [
          entry('e1', {
            files: [
              pendingFile('a.png', { status: 'uploading' }),
              pendingFile('b.png', {
                status: 'error',
                error: 'Server said no',
              }),
            ],
          }),
        ],
      });

      expect(screen.getByText('Server said no')).toBeInTheDocument();
      expect(
        screen.getAllByRole('button', { name: /DOCUMENT_UPLOAD_REMOVE_FILE/ }),
      ).toHaveLength(1);
    });
  });

  describe('browsing for files', () => {
    it('is held back, with an error, while a required type is missing', () => {
      renderWidget({ config: TYPE_REQUIRED_CONFIG });

      const allowed = fireEvent.click(fileInputs()[0]);

      expect(allowed).toBe(false);
      expect(latest()[0].errors.documentType).toBe(
        'DOCUMENTS_SELECT_DOCUMENT_TYPE',
      );
    });

    it('is allowed once the document has a type', () => {
      renderWidget({
        config: TYPE_REQUIRED_CONFIG,
        initial: [entry('e1', { documentType: TYPES[0] })],
      });

      expect(fireEvent.click(fileInputs()[0])).toBe(true);
    });

    it('is not held back when the type is not required', () => {
      renderWidget();

      expect(fireEvent.click(fileInputs()[0])).toBe(true);
    });
  });

  describe('configuration', () => {
    it('loads the document types from the configured concept set', async () => {
      renderWidget({ config: { metadata: METADATA } });

      await waitFor(() =>
        expect(getDocumentTypes).toHaveBeenCalledWith('Document Type'),
      );
    });

    it('loads the document types by the concept uuid in the config', async () => {
      renderWidget({
        config: { metadata: { documentTypeConceptSetUuid: 'set-uuid' } },
      });

      await waitFor(() =>
        expect(getDocumentTypesByConceptUuid).toHaveBeenCalledWith('set-uuid'),
      );
      expect(getDocumentTypes).not.toHaveBeenCalled();
    });

    it('shows a configuration error instead of the widget without a concept uuid or name', () => {
      renderWidget({ config: { metadata: {} } });

      expect(
        screen.getByText('DOCUMENTS_ERROR_INVALID_CONFIGURATION'),
      ).toBeVisible();
      expect(fileInputs()).toHaveLength(0);
      expect(getDocumentTypes).not.toHaveBeenCalled();
    });

    it('shows an error instead of the widget when the document types cannot be loaded', async () => {
      getDocumentTypes.mockRejectedValue(new Error('boom'));
      renderWidget({ config: { metadata: METADATA } });

      expect(
        await screen.findByText('DOCUMENTS_ERROR_LOADING_DOCUMENT_TYPES'),
      ).toBeVisible();
      expect(fileInputs()).toHaveLength(0);
    });
  });
});
