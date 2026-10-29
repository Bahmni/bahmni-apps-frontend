import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import DocumentsForm from '../DocumentsForm';
import { useDocumentsStore } from '../store';
import { documentsControlConfig } from './__mocks__/documentsMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
  getDocumentTypes: jest.fn(),
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
  config?: unknown;
  documentsTitle?: string;
}

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  DocumentUpload: (props: StubWidgetProps) => (
    <div
      data-testid="document-upload"
      data-title={props.documentsTitle}
      data-config={JSON.stringify(props.config)}
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
              ...jest
                .requireActual('./__mocks__/documentsMocks')
                .createBlankDocumentEntry('DOC-77'),
              id: `doc-${props.documents.length}`,
            },
          ])
        }
      >
        add-document
      </button>
    </div>
  ),
}));

const renderForm = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <DocumentsForm inputControlConfig={documentsControlConfig} />
    </QueryClientProvider>,
  );

const state = () => useDocumentsStore.getState();

describe('DocumentsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = jest.fn();
    act(() => state().reset());
  });

  it('renders the configured title and the documents widget under it', () => {
    renderForm();

    expect(screen.getByText('DOCUMENTS_INPUT_CONTROL_LABEL')).toBeVisible();
    expect(screen.getByTestId('document-upload')).toHaveAttribute(
      'data-title',
      'DOCUMENTS_ADD_ACTION',
    );
  });

  it('hands the control config to the widget, which decides how to use it', () => {
    renderForm();

    expect(
      JSON.parse(
        screen.getByTestId('document-upload').getAttribute('data-config')!,
      ),
    ).toEqual(documentsControlConfig);
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
});
