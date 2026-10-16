import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { InputControl } from '../../../../providers/clinicalConfig/models';
import DocumentsForm from '../DocumentsForm';
import { useDocumentsStore } from '../store';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
  getDocumentTypesByConceptUuid: jest.fn(),
  uploadDocument: jest.fn().mockResolvedValue({ url: '100/scan.png' }),
}));

interface StubWidgetProps {
  documents: Array<{
    id: string;
    documentId: string;
    files: Array<{ fileName: string }>;
    errors: Record<string, string>;
  }>;
  onDocumentsChange: (documents: unknown[]) => void;
  documentTypes: Array<{ id: string; label: string }>;
  isDocumentTypeRequired: boolean;
  showDocumentId: boolean;
  isDocumentIdRequired: boolean;
  supportedFileTypes?: string[];
  documentsTitle?: string;
}

// The widget itself is covered in @bahmni/widgets; here it only needs to drive the form.
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  DocumentUpload: (props: StubWidgetProps) => (
    <div
      data-testid="document-upload"
      data-title={props.documentsTitle}
      data-types={props.supportedFileTypes?.join(',')}
      data-type-count={props.documentTypes.length}
      data-show-id={String(props.showDocumentId)}
      data-type-required={String(props.isDocumentTypeRequired)}
      data-id-required={String(props.isDocumentIdRequired)}
    >
      <span data-testid="document-count">{props.documents.length}</span>
      <span data-testid="errors">
        {props.documents.flatMap((d) => Object.values(d.errors)).join(',')}
      </span>
      <button
        onClick={() =>
          props.onDocumentsChange([
            ...props.documents,
            {
              id: `doc-${props.documents.length}`,
              documentType: null,
              documentId: 'DOC-77',
              note: '',
              files: [],
              errors: {},
            },
          ])
        }
      >
        add-document
      </button>
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

  it('renders the configured title and the documents widget under it', () => {
    renderForm();

    expect(screen.getByText('DOCUMENTS_INPUT_CONTROL_LABEL')).toBeVisible();
    expect(screen.getByTestId('document-upload')).toHaveAttribute(
      'data-title',
      'DOCUMENTS_ADDED_DOCUMENT_TYPE',
    );
  });

  it('configures the widget from the control config', () => {
    renderForm();

    const widget = screen.getByTestId('document-upload');
    expect(widget).toHaveAttribute('data-types', '.pdf,.png');
    expect(widget).toHaveAttribute('data-show-id', 'true');
    expect(widget).toHaveAttribute('data-type-required', 'true');
    expect(widget).toHaveAttribute('data-id-required', 'true');
  });

  it('loads the document types from the configured concept set into the widget', async () => {
    renderForm();

    await waitFor(() =>
      expect(getDocumentTypesByConceptUuid).toHaveBeenCalledWith('set-uuid'),
    );
    await waitFor(() =>
      expect(screen.getByTestId('document-upload')).toHaveAttribute(
        'data-type-count',
        '2',
      ),
    );
  });

  it('keeps the documents the widget reports in the store', async () => {
    renderForm();
    expect(screen.getByTestId('document-count')).toHaveTextContent('0');

    act(() => screen.getByText('add-document').click());

    expect(state().entries).toHaveLength(1);
    expect(state().entries[0].documentId).toBe('DOC-77');
    expect(screen.getByTestId('document-count')).toHaveTextContent('1');
  });

  it('shows the validation errors the store raises through the widget', async () => {
    renderForm();
    act(() => screen.getByText('add-document').click());

    act(() => {
      state().validateAll();
    });

    const errors = await screen.findByTestId('errors');
    expect(errors).toHaveTextContent('DOCUMENTS_SELECT_DOCUMENT_TYPE');
    expect(errors).toHaveTextContent('DOCUMENTS_UPLOAD_A_DOCUMENT');
  });

  it('tells the user when the document types cannot be loaded', async () => {
    getDocumentTypesByConceptUuid.mockRejectedValue(new Error('boom'));
    renderForm();

    expect(
      await screen.findByText('DOCUMENTS_ERROR_LOADING_DOCUMENT_TYPES'),
    ).toBeVisible();
  });
});
