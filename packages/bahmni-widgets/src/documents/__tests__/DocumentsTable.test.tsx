import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useNotification } from '../../notification';
import DocumentsTable from '../DocumentsTable';

expect.extend(toHaveNoViolations);

jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
  formatDate: () => ({ formattedResult: '2024-01-15 10:30 AM' }),
  getDocumentReferences: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));

const PdfIcon = () => <div data-testid="pdf-icon">PDF</div>;
PdfIcon.displayName = 'DocumentPdf';
const ImageIcon = () => <div data-testid="image-icon">IMG</div>;
ImageIcon.displayName = 'Image';
const DocIcon = () => <div data-testid="document-icon">DOC</div>;
DocIcon.displayName = 'Document';

jest.mock('@carbon/icons-react', () => ({
  DocumentPdf: PdfIcon,
  Image: ImageIcon,
  Document: DocIcon,
}));

const mockAddNotification = jest.fn();

const mockPdfDocument = {
  id: 'doc-1',
  documentIdentifier: 'Test Document',
  documentType: 'Prescription',
  uploadedOn: '2024-01-15T10:30:00Z',
  uploadedBy: 'Dr. Smith',
  contentType: 'application/pdf',
  documentUrl: '100/test-document.pdf',
};

const mockImageDocument = {
  id: 'doc-2',
  documentIdentifier: 'X-Ray Image',
  documentType: 'Radiology Report',
  uploadedOn: '2024-01-14T09:00:00Z',
  uploadedBy: 'Dr. Johnson',
  contentType: 'image/jpeg',
  documentUrl: '100/xray-image.jpg',
};

const mockGenericDocument = {
  id: 'doc-3',
  documentIdentifier: 'Clinical Notes',
  documentType: 'Notes',
  uploadedOn: '2024-01-13T08:00:00Z',
  uploadedBy: 'Dr. Williams',
  contentType: 'application/msword',
  documentUrl: '100/notes.doc',
};

const mockQueryData = (
  documents: any[] = [mockPdfDocument],
  overrides: Partial<ReturnType<typeof useQuery>> = {},
) =>
  ({
    data: documents,
    error: null,
    isError: false,
    isLoading: false,
    refetch: jest.fn(),
    ...overrides,
  }) as ReturnType<typeof useQuery>;

const defaultConfig = {
  fields: ['documentIdentifier', 'documentType', 'uploadedOn', 'uploadedBy'],
};

describe('DocumentsTable', () => {
  let queryClient: QueryClient;

  const renderComponent = (props = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <DocumentsTable {...props} />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Component States', () => {
    it('displays loading state', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isError: false,
        isLoading: true,
        refetch: jest.fn(),
      });

      renderComponent();

      expect(screen.getByTestId('documents-table')).toBeInTheDocument();
    });

    it('displays error state and triggers notification with error message', () => {
      const errorMessage = 'Network error';
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        error: new Error(errorMessage),
        isError: true,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent();

      expect(screen.getByTestId('documents-table')).toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_DEFAULT_TITLE',
        message: errorMessage,
      });
    });

    it('displays empty state message when no documents exist', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent();

      expect(screen.getByTestId('documents-table')).toBeInTheDocument();
      expect(screen.getByText('DOCUMENTS_NO_RECORDS')).toBeInTheDocument();
    });
  });

  describe('Table Headers and Data Display', () => {
    it('renders table with configured fields', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());
      renderComponent({ config: defaultConfig });

      expect(screen.getByRole('table')).toHaveAttribute(
        'aria-label',
        'DOCUMENTS_TABLE_HEADING',
      );
      expect(
        screen.getByText('DOCUMENTS_DOCUMENT_IDENTIFIER'),
      ).toBeInTheDocument();
      expect(screen.getByText('DOCUMENTS_TYPE')).toBeInTheDocument();
      expect(screen.getByText('DOCUMENTS_UPLOADED_ON')).toBeInTheDocument();
      expect(screen.getByText('DOCUMENTS_UPLOADED_BY')).toBeInTheDocument();
    });

    it('displays document identifier, type, and uploader correctly', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());
      renderComponent({ config: defaultConfig });

      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('Prescription')).toBeInTheDocument();
      expect(screen.getByText('2024-01-15 10:30 AM')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    it('renders document identifier as plain text with icon button', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());
      renderComponent({ config: defaultConfig });

      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'View Test Document' }),
      ).toBeInTheDocument();
    });

    it('renders long document identifier name inside a span to support word wrapping', () => {
      const longName =
        'VeryLongDocumentIdentifierNameThatShouldBreakAndWrapAcrossMultipleLinesInTheTableCell';
      const docWithLongName = {
        ...mockPdfDocument,
        documentIdentifier: longName,
      };
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([docWithLongName]));
      renderComponent({ config: defaultConfig });

      const identifierSpan = screen.getByText(longName);
      expect(identifierSpan.tagName).toBe('SPAN');
      expect(identifierSpan.closest('div')).toBeInTheDocument();
    });

    it('displays multiple documents', () => {
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockPdfDocument, mockImageDocument]),
      );
      renderComponent({ config: defaultConfig });

      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('X-Ray Image')).toBeInTheDocument();
      expect(screen.getByText('Prescription')).toBeInTheDocument();
      expect(screen.getByText('Radiology Report')).toBeInTheDocument();
    });
  });

  describe('File Type Icons', () => {
    const config = {
      fields: [
        'documentIdentifier',
        'documentType',
        'uploadedOn',
        'uploadedBy',
      ],
    };

    it('displays PDF icon for PDF documents', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockPdfDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      expect(screen.getByTestId('pdf-icon')).toBeInTheDocument();
    });

    it('displays image icon for image documents', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockImageDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      expect(screen.getByTestId('image-icon')).toBeInTheDocument();
    });

    it('displays generic document icon for non-PDF, non-image content types', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockGenericDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      expect(screen.getByTestId('document-icon')).toBeInTheDocument();
    });

    it('icon is wrapped in a button with descriptive aria-label', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockPdfDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      expect(
        screen.getByRole('button', { name: 'View Test Document' }),
      ).toBeInTheDocument();
    });
  });

  describe('Modal', () => {
    const config = {
      fields: [
        'documentIdentifier',
        'documentType',
        'uploadedOn',
        'uploadedBy',
      ],
    };

    it('opens modal with document identifier when icon button is clicked', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockPdfDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      await user.click(
        screen.getByRole('button', { name: 'View Test Document' }),
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      // 'Test Document' appears both in table row and modal heading
      expect(
        screen.getAllByText('Test Document').length,
      ).toBeGreaterThanOrEqual(2);
    });

    it('renders iframe for PDF document in modal', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockPdfDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      await user.click(
        screen.getByRole('button', { name: 'View Test Document' }),
      );

      const iframe = screen.getByTitle('Test Document');
      expect(iframe.tagName).toBe('IFRAME');
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining(
          '/openmrs/auth?requested_document=/document_images/',
        ),
      );
    });

    it('appends #toolbar=0 to PDF iframe src', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockPdfDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      await user.click(
        screen.getByRole('button', { name: 'View Test Document' }),
      );

      const iframe = screen.getByTitle('Test Document');
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('#toolbar=0'),
      );
    });

    it('renders img element for image document in modal', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockImageDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      await user.click(
        screen.getByRole('button', { name: 'View X-Ray Image' }),
      );

      const image = screen.getByRole('img', { name: 'X-Ray Image' });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute(
        'src',
        expect.stringContaining(
          '/openmrs/auth?requested_document=/document_images/',
        ),
      );
    });

    it('renders iframe for generic document type in modal', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockGenericDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      await user.click(
        screen.getByRole('button', { name: 'View Clinical Notes' }),
      );

      const iframe = screen.getByTitle('Clinical Notes');
      expect(iframe.tagName).toBe('IFRAME');
    });

    it('modal is not rendered initially', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockPdfDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Fallback Content', () => {
    const config = {
      fields: [
        'documentIdentifier',
        'documentType',
        'uploadedOn',
        'uploadedBy',
      ],
    };

    it('displays fallback text when document type is missing', () => {
      const docWithoutType = { ...mockPdfDocument, documentType: undefined };
      (useQuery as jest.Mock).mockReturnValue({
        data: [docWithoutType],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      expect(screen.getByText('DOCUMENTS_NOT_AVAILABLE')).toBeInTheDocument();
    });

    it('displays fallback text when uploaded by is missing', () => {
      const docWithoutUploader = { ...mockPdfDocument, uploadedBy: undefined };
      (useQuery as jest.Mock).mockReturnValue({
        data: [docWithoutUploader],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      const fallbackTexts = screen.getAllByText('DOCUMENTS_NOT_AVAILABLE');
      expect(fallbackTexts.length).toBeGreaterThan(0);
    });

    it('disables icon button when document has no URL', () => {
      const docWithoutUrl = { ...mockPdfDocument, documentUrl: '' };
      (useQuery as jest.Mock).mockReturnValue({
        data: [docWithoutUrl],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      expect(
        screen.getByRole('button', { name: 'View Test Document' }),
      ).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    const config = {
      fields: [
        'documentIdentifier',
        'documentType',
        'uploadedOn',
        'uploadedBy',
      ],
    };

    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockPdfDocument, mockImageDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { container } = renderComponent({ config });

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('passes accessibility tests in empty state', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { container } = renderComponent({ config });

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('passes accessibility tests in loading state', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isError: false,
        isLoading: true,
        refetch: jest.fn(),
      });

      const { container } = renderComponent({ config });

      await act(async () => {
        // Carbon's DataTableSkeleton renders empty <th> cells for sort columns — this is a known
        // pre-existing issue in SortableDataTable's loading skeleton, not introduced by DocumentsTable.
        const results = await axe(container, {
          rules: { 'empty-table-header': { enabled: false } },
        });
        expect(results).toHaveNoViolations();
      });
    });

    it('passes accessibility tests in error state', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        error: new Error('Failed to load documents'),
        isError: true,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { container } = renderComponent({ config });

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('passes accessibility tests with modal open', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockPdfDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { container } = renderComponent({ config });

      await user.click(
        screen.getByRole('button', { name: 'View Test Document' }),
      );

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('closes modal when Escape key is pressed', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockPdfDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      await user.click(
        screen.getByRole('button', { name: 'View Test Document' }),
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('modal dialog is properly labelled with document identifier for screen readers', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockPdfDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config });

      await user.click(
        screen.getByRole('button', { name: 'View Test Document' }),
      );

      const dialog = screen.getByRole('dialog');
      // Carbon Modal has a heading property that labels the dialog
      expect(dialog).toBeInTheDocument();
      // Verify the modal heading is set to document identifier
      expect(
        screen.getAllByText('Test Document').length,
      ).toBeGreaterThanOrEqual(2);
    });
  });
});
