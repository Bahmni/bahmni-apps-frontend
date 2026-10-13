import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { InputControl } from '../../../../providers/clinicalConfig/models';
import DocumentsForm from '../DocumentsForm';
import { useDocumentsStore } from '../store';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
  getDocumentTypesByConceptUuid: jest.fn(),
  uploadDocument: jest.fn().mockResolvedValue({ url: '100/scan.png' }),
}));

// The picker itself is covered in @bahmni/widgets; here it only needs to drive the card.
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  DocumentUpload: ({
    documents,
    onDocumentsChange,
    canSelectFiles,
    supportedFileTypes,
  }: {
    documents: Array<{ id: string; fileName: string }>;
    onDocumentsChange: (documents: unknown[]) => void;
    canSelectFiles: () => boolean;
    supportedFileTypes?: string[];
  }) => (
    <div
      data-testid="document-upload"
      data-types={supportedFileTypes?.join(',')}
    >
      <button
        onClick={() => {
          if (canSelectFiles()) {
            onDocumentsChange([
              ...documents,
              {
                id: `pending-${documents.length}`,
                file: new globalThis.File(['x'], 'scan.png', {
                  type: 'image/png',
                }),
                url: 'blob:preview',
                fileName: 'scan.png',
                contentType: 'image/png',
                documentType: null,
                note: '',
                isNoteVisible: false,
              },
            ]);
          }
        }}
      >
        pick
      </button>
      {documents.map((document) => (
        <button
          key={document.id}
          onClick={() =>
            onDocumentsChange(documents.filter((d) => d.id !== document.id))
          }
        >
          remove {document.fileName}
        </button>
      ))}
    </div>
  ),
}));

const { getDocumentTypesByConceptUuid } = jest.requireMock('@bahmni/services');

const config: InputControl = {
  type: 'documents',
  label: 'DOCUMENTS_INPUT_CONTROL_LABEL',
  encounterTypes: ['Patient Document'],
  privileges: ['Add Encounters'],
  attributes: [
    { name: 'documentType', required: true },
    { name: 'documentId', required: true },
  ],
  metadata: {
    documentTypeConceptSetUuid: 'set-uuid',
    supportedFileTypes: ['.pdf', '.png'],
  },
};

const renderForm = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <DocumentsForm inputControlConfig={config} />
    </QueryClientProvider>,
  );

const state = () => useDocumentsStore.getState();

describe('DocumentsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = jest.fn();
    act(() => state().reset());
    getDocumentTypesByConceptUuid.mockResolvedValue([
      { id: 'type-1', label: 'Consent form' },
      { id: 'type-2', label: 'Lab report' },
    ]);
  });

  it('opens with one empty document card under the configured title', () => {
    renderForm();

    expect(screen.getByText('DOCUMENTS_INPUT_CONTROL_LABEL')).toBeVisible();
    expect(screen.getByText('DOCUMENTS_ADDED_DOCUMENT_TYPE')).toBeVisible();
    expect(state().entries).toHaveLength(1);
    expect(screen.getAllByTestId(/^document-entry-/)).toHaveLength(1);
  });

  it('loads the document types from the configured concept set', async () => {
    renderForm();

    await waitFor(() =>
      expect(getDocumentTypesByConceptUuid).toHaveBeenCalledWith('set-uuid'),
    );
  });

  it('passes the configured file types on to the picker', () => {
    renderForm();

    expect(screen.getByTestId('document-upload')).toHaveAttribute(
      'data-types',
      '.pdf,.png',
    );
  });

  it('adds another card with "Add more" and removes a card with its close button', async () => {
    renderForm();

    await userEvent.click(screen.getByTestId('documents-add-more'));
    expect(screen.getAllByTestId(/^document-entry-/)).toHaveLength(2);

    await userEvent.click(screen.getAllByRole('button', { name: /close/i })[0]);
    expect(screen.getAllByTestId(/^document-entry-/)).toHaveLength(1);
  });

  it('keeps a card on screen after the last one is removed', async () => {
    renderForm();

    await userEvent.click(screen.getAllByRole('button', { name: /close/i })[0]);

    expect(screen.getAllByTestId(/^document-entry-/)).toHaveLength(1);
  });

  it('blocks choosing files until a document type is selected', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'pick' }));

    expect(screen.getByText('DOCUMENTS_SELECT_DOCUMENT_TYPE')).toBeVisible();
    expect(state().entries[0].files).toEqual([]);
  });

  it('stores the identifier typed into the card', async () => {
    renderForm();

    await userEvent.type(
      screen.getByTestId(`document-id-${state().entries[0].id}`),
      'DOC-77',
    );

    expect(state().entries[0].documentId).toBe('DOC-77');
  });

  it('reveals the note field from "Add note" and clears the note when it is closed', async () => {
    renderForm();

    await userEvent.click(screen.getByText('DOCUMENTS_ADD_NOTE'));
    const note = screen.getByPlaceholderText('DOCUMENTS_NOTE_PLACEHOLDER');
    await userEvent.type(note, 'signed copy');
    expect(state().entries[0].note).toBe('signed copy');

    await userEvent.click(
      screen
        .getByTestId(`document-entry-${state().entries[0].id}`)
        .querySelector('button[aria-label*="lose"]') as HTMLElement,
    );

    expect(state().entries[0].note).toBe('');
    expect(screen.getByText('DOCUMENTS_ADD_NOTE')).toBeVisible();
  });

  it('attaches a picked file to the card and lets it be removed', async () => {
    renderForm();
    const id = state().entries[0].id;
    act(() => {
      state().updateDocumentType(id, { id: 'type-1', label: 'Consent form' });
    });

    await userEvent.click(screen.getByRole('button', { name: 'pick' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'remove scan.png' }),
    );

    expect(state().entries[0].files).toEqual([]);
  });

  it('shows the validation errors the store raises', async () => {
    renderForm();
    act(() => {
      state().updateNote(state().entries[0].id, 'note only');
      state().validateAll();
    });

    expect(
      await screen.findByText('DOCUMENTS_SELECT_DOCUMENT_TYPE'),
    ).toBeVisible();
    expect(screen.getByText('DOCUMENTS_UPLOAD_A_DOCUMENT')).toBeVisible();
    expect(screen.getByText('INPUT_VALUE_REQUIRED')).toBeVisible();
  });

  it('tells the user when the document types cannot be loaded', async () => {
    getDocumentTypesByConceptUuid.mockRejectedValue(new Error('boom'));
    renderForm();

    expect(
      await screen.findByText('DOCUMENTS_ERROR_LOADING_DOCUMENT_TYPES'),
    ).toBeVisible();
  });
});
