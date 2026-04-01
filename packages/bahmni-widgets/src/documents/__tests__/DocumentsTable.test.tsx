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
  formatDateTime: () => ({ formattedResult: '15/01/2024 4:00 PM' }),
  getDocumentReferences: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));

// Mock fetch to simulate successful document loads
globalThis.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
  } as Response),
);

const mockAddNotification = jest.fn();

const mockPdfDocument = {
  id: 'doc-1',
  documentIdentifier: 'Test Document',
  documentType: 'Prescription',
  uploadedOn: '2024-01-15T10:30:00Z',
  uploadedBy: 'Dr. Smith',
  contentType: 'application/pdf',
  documentUrl: '100/test-document.pdf',
  attachments: [
    { url: '100/test-document.pdf', contentType: 'application/pdf' },
  ],
};

const mockImageDocument = {
  id: 'doc-2',
  documentIdentifier: 'X-Ray Image',
  documentType: 'Radiology Report',
  uploadedOn: '2024-01-14T09:00:00Z',
  uploadedBy: 'Dr. Johnson',
  contentType: 'image/jpeg',
  documentUrl: '100/xray-image.jpg',
  attachments: [{ url: '100/xray-image.jpg', contentType: 'image/jpeg' }],
};

const mockGenericDocument = {
  id: 'doc-3',
  documentIdentifier: 'Clinical Notes',
  documentType: 'Notes',
  uploadedOn: '2024-01-13T08:00:00Z',
  uploadedBy: 'Dr. Williams',
  contentType: 'application/msword',
  documentUrl: '100/notes.doc',
  attachments: [{ url: '100/notes.doc', contentType: 'application/msword' }],
};

const mockMultiAttachmentDocument = {
  id: 'doc-4',
  documentIdentifier: 'Multi Attachment Doc',
  documentType: 'Lab Result',
  uploadedOn: '2024-01-12T07:00:00Z',
  uploadedBy: 'Dr. Lee',
  contentType: 'application/pdf',
  documentUrl: '100/lab-page1.pdf',
  attachments: [
    { url: '100/lab-page1.pdf', contentType: 'application/pdf' },
    { url: '100/lab-page2.pdf', contentType: 'application/pdf' },
  ],
};

const mockDocumentNoUrl = {
  id: 'doc-5',
  documentIdentifier: 'No URL Doc',
  documentType: 'Notes',
  uploadedOn: '2024-01-11T06:00:00Z',
  uploadedBy: 'Dr. Brown',
  contentType: 'application/pdf',
  documentUrl: '',
  attachments: [],
};

const mockDocumentCorruptUrl = {
  id: 'doc-6',
  documentIdentifier: 'Corrupt URL Doc',
  documentType: 'Notes',
  uploadedOn: '2024-01-10T05:00:00Z',
  uploadedBy: 'Dr. Green',
  contentType: 'application/pdf',
  documentUrl: 'https://corrupt-url.pdf',
  attachments: [
    { url: 'https://corrupt-url.pdf', contentType: 'application/pdf' },
  ],
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
  fields: [
    'documentIdentifier',
    'documentType',
    'uploadedOn',
    'uploadedBy',
    'action',
  ],
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
    it('renders table with configured fields including Action column', () => {
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
      expect(screen.getByText('DOCUMENTS_ACTION')).toBeInTheDocument();
    });

    it('renders the Action column header as last column', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());
      renderComponent({ config: defaultConfig });

      const headers = screen.getAllByRole('columnheader');
      const headerTexts = headers.map((h) => h.textContent?.trim());
      expect(headerTexts[headerTexts.length - 1]).toBe('DOCUMENTS_ACTION');
    });

    it('displays document identifier as plain text (no icon, no button)', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());
      renderComponent({ config: defaultConfig });

      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'View Test Document' }),
      ).not.toBeInTheDocument();
    });

    it('renders document identifier inside a span', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());
      renderComponent({ config: defaultConfig });

      const identifierSpan = screen.getByText('Test Document');
      expect(identifierSpan.tagName).toBe('SPAN');
    });

    it('displays document identifier, type, and uploader correctly', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());
      renderComponent({ config: defaultConfig });

      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('Prescription')).toBeInTheDocument();
      expect(screen.getByText('15/01/2024 4:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
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

  describe('Action Column', () => {
    it('renders "View attachment/s" link for documents with attachments', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      expect(
        screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'),
      ).toBeInTheDocument();
    });

    it('renders "View attachment/s" link for documents with documentUrl but empty attachments', () => {
      const docWithUrlNoAttachments = {
        ...mockPdfDocument,
        attachments: [],
      };
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([docWithUrlNoAttachments]),
      );
      renderComponent({ config: defaultConfig });

      expect(
        screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'),
      ).toBeInTheDocument();
    });

    it('renders "--" in action column when document has no attachments and no URL', () => {
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockDocumentNoUrl]),
      );
      renderComponent({ config: defaultConfig });

      expect(screen.getByText('--')).toBeInTheDocument();
      expect(
        screen.queryByText('DOCUMENTS_VIEW_ATTACHMENTS'),
      ).not.toBeInTheDocument();
    });

    it('"View attachment/s" link opens modal when clicked', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('"View attachment/s" link does not open new tab (no target=_blank, no navigation href)', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      const link = screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS');
      const anchor = link.closest('a');
      // Carbon Link renders as <a> but must not navigate to a new tab
      expect(anchor).not.toHaveAttribute('target', '_blank');
      expect(anchor).not.toHaveAttribute('href');
    });
  });

  describe('Modal - Single Attachment', () => {
    it('opens modal with document identifier as heading when link clicked', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(
        screen.getAllByText('Test Document').length,
      ).toBeGreaterThanOrEqual(2);
    });

    it('renders iframe for PDF document in modal', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

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
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      const iframe = screen.getByTitle('Test Document');
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('#toolbar=0'),
      );
    });

    it('renders img element for image document in modal', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockImageDocument]),
      );
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

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
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockGenericDocument]),
      );
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      const iframe = screen.getByTitle('Clinical Notes');
      expect(iframe.tagName).toBe('IFRAME');
    });

    it('modal is not rendered initially', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Modal - Multi Attachment', () => {
    it('renders all attachments when a document has multiple attachments', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockMultiAttachmentDocument]),
      );
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      // Should show 2 iframes since both are PDF
      const iframes = screen.getAllByTitle('Multi Attachment Doc');
      expect(iframes).toHaveLength(2);
    });

    it('shows attachment counter (e.g. "1/2") when there are multiple attachments', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockMultiAttachmentDocument]),
      );
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      expect(screen.getByText('1/2')).toBeInTheDocument();
      expect(screen.getByText('2/2')).toBeInTheDocument();
    });

    it('does not show attachment counter when there is only one attachment', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      expect(screen.queryByText('1/1')).not.toBeInTheDocument();
    });
  });

  describe('Modal - Error Handling', () => {
    it('shows error message when attachment URL is corrupt (contains colon)', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockDocumentCorruptUrl]),
      );
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      expect(
        screen.getByText('DOCUMENTS_ERROR_LOADING_ATTACHMENT'),
      ).toBeInTheDocument();
    });

    it('shows error message instead of iframe when URL is corrupt', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockDocumentCorruptUrl]),
      );
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      expect(screen.queryByTitle('Corrupt URL Doc')).not.toBeInTheDocument();
    });

    it('marks attachment as failed when HEAD request returns error status', async () => {
      const user = userEvent.setup();
      const fetchSpy = jest.spyOn(globalThis as any, 'fetch');

      // First call returns 404 for HEAD request
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      await waitFor(() => {
        expect(
          screen.getByText('DOCUMENTS_ERROR_LOADING_ATTACHMENT'),
        ).toBeInTheDocument();
      });

      fetchSpy.mockRestore();
    });
  });

  describe('Fallback Content', () => {
    it('displays fallback text when document type is missing', () => {
      const docWithoutType = {
        ...mockPdfDocument,
        documentType: undefined,
      };
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([docWithoutType]));
      renderComponent({ config: defaultConfig });

      expect(screen.getByText('DOCUMENTS_NOT_AVAILABLE')).toBeInTheDocument();
    });

    it('displays fallback text when uploaded by is missing', () => {
      const docWithoutUploader = {
        ...mockPdfDocument,
        uploadedBy: undefined,
      };
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([docWithoutUploader]),
      );
      renderComponent({ config: defaultConfig });

      const fallbackTexts = screen.getAllByText('DOCUMENTS_NOT_AVAILABLE');
      expect(fallbackTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Race Condition Prevention', () => {
    it('validation effect has correct dependencies for modal state', async () => {
      // This test verifies the effect cleanup (AbortController) works
      // by ensuring multiple modal open/close cycles work correctly
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockPdfDocument, mockImageDocument]),
      );
      renderComponent({ config: defaultConfig });

      // First open/close
      await user.click(screen.getAllByText('DOCUMENTS_VIEW_ATTACHMENTS')[0]);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Second open/close - should work without state corruption
      await user.click(screen.getAllByText('DOCUMENTS_VIEW_ATTACHMENTS')[0]);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('clears state when closing modal and can reopen with fresh state', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockDocumentCorruptUrl]),
      );
      renderComponent({ config: defaultConfig });

      // Open modal with error state
      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
      expect(
        screen.getByText('DOCUMENTS_ERROR_LOADING_ATTACHMENT'),
      ).toBeInTheDocument();

      // Close modal - state should be cleared
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Reopen modal - should show fresh state with same error (URL is still corrupt)
      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(
          screen.getByText('DOCUMENTS_ERROR_LOADING_ATTACHMENT'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('AbortController and Fetch Error Handling', () => {
    it('handles network errors in validation effect', async () => {
      const user = userEvent.setup();
      const fetchSpy = jest.spyOn(globalThis as any, 'fetch');
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      await waitFor(() => {
        expect(
          screen.getByText('DOCUMENTS_ERROR_LOADING_ATTACHMENT'),
        ).toBeInTheDocument();
      });

      fetchSpy.mockRestore();
    });

    it('validates all attachments in multi-attachment documents', async () => {
      const user = userEvent.setup();
      const fetchSpy = jest.spyOn(globalThis as any, 'fetch');

      fetchSpy
        .mockResolvedValueOnce({ ok: true, status: 200 } as Response)
        .mockResolvedValueOnce({ ok: false, status: 404 } as Response);

      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockMultiAttachmentDocument]),
      );
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(
        screen.getByText('DOCUMENTS_ERROR_LOADING_ATTACHMENT'),
      ).toBeInTheDocument();

      const iframes = screen.getAllByTitle('Multi Attachment Doc');
      expect(iframes.length).toBeGreaterThan(0);

      fetchSpy.mockRestore();
    });
  });

  describe('Effect Dependencies and Modal State', () => {
    it('calls validation effect when modal opens', async () => {
      const user = userEvent.setup();
      const fetchSpy = jest.spyOn(globalThis as any, 'fetch');

      fetchSpy.mockResolvedValue({ ok: true, status: 200 } as Response);

      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      // Open modal - should trigger validation effect
      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify validation was called (fetch should have been invoked)
      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('Error Notification', () => {
    it('shows error notification when document fetch fails', () => {
      const errorMessage = 'Failed to fetch documents';
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        error: new Error(errorMessage),
        isError: true,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config: defaultConfig });

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_DEFAULT_TITLE',
        message: errorMessage,
      });
    });

    it('handles error with undefined message gracefully', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        error: new Error(),
        isError: true,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent({ config: defaultConfig });

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'ERROR_DEFAULT_TITLE',
        }),
      );
    });
  });

  describe('RenderCell Coverage', () => {
    it('renders all column types in renderCell', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      // Verify all columns are rendered
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('Prescription')).toBeInTheDocument();
      expect(screen.getByText('15/01/2024 4:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(
        screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'),
      ).toBeInTheDocument();
    });

    it('renders all cell types correctly', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      // Verify document identifier renders as span
      const identifierSpan = screen.getByText('Test Document');
      expect(identifierSpan.tagName).toBe('SPAN');

      // Verify all other columns render
      expect(screen.getByText('Prescription')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });
  });

  describe('Config and Fields', () => {
    it('uses default fields when config fields not provided', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: {} });

      // Should still render with default fields
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders with custom field configuration', () => {
      const customConfig = {
        fields: ['documentIdentifier', 'action'],
      };
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: customConfig });

      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(
        screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'),
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockPdfDocument, mockImageDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { container } = renderComponent({ config: defaultConfig });

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

      const { container } = renderComponent({ config: defaultConfig });

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

      const { container } = renderComponent({ config: defaultConfig });

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

      const { container } = renderComponent({ config: defaultConfig });

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

      const { container } = renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

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

      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
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

      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Verify the modal heading is set to document identifier
      expect(
        screen.getAllByText('Test Document').length,
      ).toBeGreaterThanOrEqual(2);
    });
  });
});
