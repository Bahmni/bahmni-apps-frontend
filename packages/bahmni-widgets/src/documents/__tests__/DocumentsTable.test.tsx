import { useSubscribeConsultationSaved } from '@bahmni/services';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import {
  render,
  screen,
  act,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  printPdfViaIframe,
  printViaIframe,
} from '../../documentPrintButton/printViaIframe';
import { useNotification } from '../../notification';
import { useHasPrivilege } from '../../userPrivileges/useHasPrivilege';
import DocumentsTable from '../DocumentsTable';

expect.extend(toHaveNoViolations);

jest.mock('../../notification');
jest.mock('../../userPrivileges/useHasPrivilege');
jest.mock('../../documentPrintButton/printViaIframe', () => ({
  printViaIframe: jest.fn(),
  printPdfViaIframe: jest.fn(),
}));
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({
    t: (key: string, options?: { current?: number; total?: number }) =>
      key === 'DOCUMENTS_ATTACHMENT_COUNTER'
        ? `Attachment ${options?.current} of ${options?.total}`
        : key,
  }),
  formatDateTime: () => ({ formattedResult: '15/01/2024 4:00 PM' }),
  getDocumentReferencePage: jest.fn(),
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
    data: {
      documents,
      total: documents.length,
    },
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
    'attachments',
    'uploadedOn',
    'uploadedBy',
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
    (useHasPrivilege as jest.Mock).mockReturnValue(true);
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

    it.each([
      ['Network error', new Error('Network error'), 'Network error'],
      ['no message', new Error(), undefined],
    ])(
      'displays error state and notifies the user (%s)',
      (_label, error, message) => {
        (useQuery as jest.Mock).mockReturnValue({
          data: null,
          error,
          isError: true,
          isLoading: false,
          refetch: jest.fn(),
        });

        renderComponent();

        expect(screen.getByTestId('documents-table')).toBeInTheDocument();
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'ERROR_DEFAULT_TITLE',
            ...(message && { message }),
          }),
        );
      },
    );

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
    it('renders table with configured fields including Attachments column', () => {
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
      expect(screen.getByText('DOCUMENTS_ATTACHMENTS')).toBeInTheDocument();
    });

    it('shows each field of a document, the identifier as plain text', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());
      renderComponent({ config: defaultConfig });

      expect(screen.getByText('Test Document').tagName).toBe('SPAN');
      expect(
        screen.queryByRole('button', { name: 'View Test Document' }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Prescription')).toBeInTheDocument();
      expect(screen.getByText('15/01/2024 4:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(
        screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'),
      ).toBeInTheDocument();
    });
  });

  describe('Attachments Column', () => {
    it('renders "View attachment/s" link for a document with attachments or only a documentUrl', () => {
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([
          mockPdfDocument,
          { ...mockImageDocument, attachments: [] },
        ]),
      );
      renderComponent({ config: defaultConfig });

      expect(screen.getAllByText('DOCUMENTS_VIEW_ATTACHMENTS')).toHaveLength(2);
    });

    it('renders "--" in attachments column when document has no attachments and no URL', () => {
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockDocumentNoUrl]),
      );
      renderComponent({ config: defaultConfig });

      expect(screen.getByText('--')).toBeInTheDocument();
      expect(
        screen.queryByText('DOCUMENTS_VIEW_ATTACHMENTS'),
      ).not.toBeInTheDocument();
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
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getAllByText('Test Document').length,
      ).toBeGreaterThanOrEqual(2);
    });

    it('renders iframe for PDF document in modal, with the toolbar hidden', async () => {
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
  });

  describe('Modal - Multi Attachment', () => {
    it('renders every attachment, each labelled "Attachment n of total"', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockMultiAttachmentDocument]),
      );
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      expect(screen.getAllByTitle('Multi Attachment Doc')).toHaveLength(2);
      expect(screen.getByText('Attachment 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('Attachment 2 of 2')).toBeInTheDocument();
      expect(screen.queryByText('1/2')).not.toBeInTheDocument();
    });

    it('does not show attachment counter when there is only one attachment', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      expect(
        screen.queryByText(/^Attachment \d+ of \d+$/),
      ).not.toBeInTheDocument();
    });
  });

  describe('Modal - Error Handling', () => {
    it('shows an error message instead of the frame when the attachment URL is corrupt', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockDocumentCorruptUrl]),
      );
      renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      expect(
        screen.getByText('DOCUMENTS_ERROR_LOADING_ATTACHMENT'),
      ).toBeInTheDocument();
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
    it('displays fallback text for a missing document type and uploader', () => {
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([
          {
            ...mockPdfDocument,
            documentType: undefined,
            uploadedBy: undefined,
          },
        ]),
      );
      renderComponent({ config: defaultConfig });

      expect(screen.getAllByText('DOCUMENTS_NOT_AVAILABLE')).toHaveLength(2);
    });
  });

  describe('State Management', () => {
    it('closes on Escape and can be reopened with fresh state', async () => {
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

  describe('Pagination', () => {
    const manyDocs = Array.from({ length: 12 }, (_, i) => ({
      id: `doc-page-${i}`,
      documentIdentifier: `Document ${i + 1}`,
      documentType: 'Notes',
      uploadedOn: '2024-01-01T00:00:00Z',
      uploadedBy: `Dr. ${i + 1}`,
      contentType: 'application/pdf',
      documentUrl: `100/doc-${i}.pdf`,
      attachments: [
        { url: `100/doc-${i}.pdf`, contentType: 'application/pdf' },
      ],
    }));

    it('shows pagination footer but disables next when documents are fewer than or equal to pageSize', () => {
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockPdfDocument, mockImageDocument]),
      );
      renderComponent({ config: { ...defaultConfig, pageSize: 10 } });

      expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    });

    it('respects config pageSize to show only that many rows per page', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData(manyDocs));
      renderComponent({ config: { ...defaultConfig, pageSize: 5 } });

      expect(screen.getByText('Document 1')).toBeInTheDocument();
      expect(screen.getByText('Document 5')).toBeInTheDocument();
      expect(screen.queryByText('Document 6')).not.toBeInTheDocument();
    });

    it('navigates to next page showing different rows', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(mockQueryData(manyDocs));
      renderComponent({ config: { ...defaultConfig, pageSize: 5 } });

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(screen.getByText('Document 6')).toBeInTheDocument();
      expect(screen.queryByText('Document 1')).not.toBeInTheDocument();
    });

    it('shows more rows after user increases page size via dropdown', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(mockQueryData(manyDocs));
      renderComponent({ config: { ...defaultConfig, pageSize: 5 } });

      // Initially only 5 rows visible
      expect(screen.getByText('Document 5')).toBeInTheDocument();
      expect(screen.queryByText('Document 6')).not.toBeInTheDocument();

      // User changes page size to 10
      const select = screen.getByRole('combobox', { name: /items per page/i });
      await user.selectOptions(select, '10');

      // All 10 rows now visible
      expect(screen.getByText('Document 6')).toBeInTheDocument();
    });
  });

  describe('Default Sort', () => {
    it('sorts documents by uploadedOn descending by default', () => {
      // Pass docs in ascending order (oldest first) — component must reverse them
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([
          mockGenericDocument, // 2024-01-13 (oldest)
          mockImageDocument, // 2024-01-14
          mockPdfDocument, // 2024-01-15 (newest)
        ]),
      );
      renderComponent({ config: defaultConfig });

      const rows = screen.getAllByRole('row');
      // rows[0] = header; data rows start at index 1
      expect(rows[1]).toHaveTextContent('Test Document'); // Jan 15 — newest first
      expect(rows[2]).toHaveTextContent('X-Ray Image'); // Jan 14
      expect(rows[3]).toHaveTextContent('Clinical Notes'); // Jan 13 — oldest last
    });

    it('places documents with no uploadedOn at the bottom', () => {
      const noDateDoc = {
        ...mockPdfDocument,
        id: 'doc-no-date',
        documentIdentifier: 'No Date Doc',
        uploadedOn: '',
      };
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([
          noDateDoc, // no date — should go to bottom
          mockImageDocument, // 2024-01-14
          mockPdfDocument, // 2024-01-15
        ]),
      );
      renderComponent({ config: defaultConfig });

      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Test Document'); // Jan 15 first
      expect(rows[2]).toHaveTextContent('X-Ray Image'); // Jan 14 second
      expect(rows[3]).toHaveTextContent('No Date Doc'); // no date last
    });

    it('maintains date desc sort order when navigating to page 2', async () => {
      const user = userEvent.setup();
      const pagedDocs = Array.from({ length: 12 }, (_, i) => ({
        id: `sort-doc-${i}`,
        documentIdentifier: `Doc ${String(i + 1).padStart(2, '0')}`,
        documentType: 'Notes',
        uploadedOn: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        uploadedBy: 'Dr. Test',
        contentType: 'application/pdf',
        documentUrl: `100/doc-${i}.pdf`,
        attachments: [
          { url: `100/doc-${i}.pdf`, contentType: 'application/pdf' },
        ],
      }));

      // Pass in ascending order — component must sort descending before paginating
      (useQuery as jest.Mock).mockReturnValue(mockQueryData(pagedDocs));
      renderComponent({ config: { ...defaultConfig, pageSize: 5 } });

      // Page 1: should show 5 newest (Doc 12 → Doc 08)
      const page1Rows = screen.getAllByRole('row').slice(1);
      expect(page1Rows[0]).toHaveTextContent('Doc 12');
      expect(page1Rows[4]).toHaveTextContent('Doc 08');

      // Navigate to page 2 — should show next 5 in desc order (Doc 07 → Doc 03)
      await user.click(screen.getByRole('button', { name: /next page/i }));

      const page2Rows = screen.getAllByRole('row').slice(1);
      expect(page2Rows[0]).toHaveTextContent('Doc 07');
      expect(page2Rows[4]).toHaveTextContent('Doc 03');
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockPdfDocument, mockImageDocument]),
      );

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

    it('passes accessibility tests with modal open', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));

      const { container } = renderComponent({ config: defaultConfig });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('Columns', () => {
    // A sortable header's text also carries its "Click to sort…" hint.
    const columnNames = () =>
      screen
        .getAllByRole('columnheader')
        .map((header) =>
          (header.textContent ?? '').replace(
            /^Click to sort rows by .* header in ascending order/,
            '',
          ),
        );

    it('puts Document type first by default, then the identifier, attachments, upload date and uploader', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));

      renderComponent({});

      expect(columnNames()).toEqual([
        'DOCUMENTS_TYPE',
        'DOCUMENTS_DOCUMENT_IDENTIFIER',
        'DOCUMENTS_ATTACHMENTS',
        'DOCUMENTS_UPLOADED_ON',
        'DOCUMENTS_UPLOADED_BY',
      ]);
    });

    it('shows a dash for a document with no identifier', () => {
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([
          { ...mockPdfDocument, id: 'doc-empty', documentIdentifier: '' },
          { ...mockImageDocument, id: 'doc-blank', documentIdentifier: '   ' },
          mockMultiAttachmentDocument,
        ]),
      );

      renderComponent({});

      const rows = screen.getAllByRole('row').slice(1);
      const identifierCells = rows.map(
        (row) => within(row).getAllByRole('cell')[1].textContent,
      );
      expect(identifierCells).toEqual(
        expect.arrayContaining(['-', '-', 'Multi Attachment Doc']),
      );
      expect(identifierCells.filter((text) => text === '-')).toHaveLength(2);
    });

    it('follows the order the dashboard config lists the fields in', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));

      renderComponent({
        config: { fields: ['documentIdentifier', 'documentType'] },
      });

      expect(columnNames()).toEqual([
        'DOCUMENTS_DOCUMENT_IDENTIFIER',
        'DOCUMENTS_TYPE',
      ]);
    });
  });

  describe('Opening the attachment viewer', () => {
    beforeEach(() => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });
    });

    const openViewer = async (documents: unknown[]) => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(mockQueryData(documents));
      renderComponent({ config: defaultConfig });
      await user.click(screen.getAllByText('DOCUMENTS_VIEW_ATTACHMENTS')[0]);
      return user;
    };

    it.each([
      [
        'an image',
        mockImageDocument,
        () => screen.getByRole('img', { name: 'X-Ray Image' }),
      ],
      ['a pdf', mockPdfDocument, () => screen.getByTitle('Test Document')],
    ])(
      'shows a spinner for %s until it has loaded',
      async (_label, document, attachment) => {
        await openViewer([document]);

        expect(screen.getByTestId('attachment-loading-0')).toBeInTheDocument();

        fireEvent.load(attachment());

        expect(screen.queryByTestId('attachment-loading-0')).toBeNull();
      },
    );

    it('starts every attachment with a spinner again each time the viewer is opened', async () => {
      const user = await openViewer([mockImageDocument]);
      fireEvent.load(screen.getByRole('img', { name: 'X-Ray Image' }));
      await user.click(screen.getByRole('button', { name: /close/i }));

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      expect(screen.getByTestId('attachment-loading-0')).toBeInTheDocument();
    });

    describe('printing while attachments are loading', () => {
      const printButtons = () => [
        screen.getByTestId('print-all-attachments'),
        screen.getByTestId('print-attachment-0'),
        screen.getByTestId('print-attachment-1'),
      ];
      const attachmentFrames = () =>
        Array.from(
          document.querySelectorAll(
            '[data-testid="document-view-modal"] iframe',
          ),
        );

      it('keeps the print buttons disabled until every attachment has loaded', async () => {
        await openViewer([mockMultiAttachmentDocument]);

        printButtons().forEach((button) => expect(button).toBeDisabled());

        const [first, second] = attachmentFrames();
        fireEvent.load(first);
        printButtons().forEach((button) => expect(button).toBeDisabled());

        fireEvent.load(second);
        printButtons().forEach((button) => expect(button).toBeEnabled());
      });

      it('does not wait for an attachment that failed to load', async () => {
        (globalThis.fetch as jest.Mock).mockImplementation(
          async (url: string) => ({
            ok: !url.includes('lab-page2'),
            status: 200,
          }),
        );
        await openViewer([mockMultiAttachmentDocument]);

        await screen.findByTestId('attachment-error-1');
        fireEvent.load(attachmentFrames()[0]);

        expect(screen.getByTestId('print-attachment-0')).toBeEnabled();
      });

      it('gives up waiting for a frame that never reports loading', async () => {
        jest.useFakeTimers();
        try {
          (useQuery as jest.Mock).mockReturnValue(
            mockQueryData([mockMultiAttachmentDocument]),
          );
          renderComponent({ config: defaultConfig });
          fireEvent.click(screen.getAllByText('DOCUMENTS_VIEW_ATTACHMENTS')[0]);
          expect(screen.getByTestId('print-all-attachments')).toBeDisabled();

          act(() => {
            jest.advanceTimersByTime(15000);
          });

          expect(screen.getByTestId('print-all-attachments')).toBeEnabled();
        } finally {
          jest.useRealTimers();
        }
      });
    });

    describe('scroll position', () => {
      const scroller = () =>
        document.querySelector('.cds--modal-content') as HTMLElement;
      const jumpTo = (top: number) => {
        scroller().scrollTop = top;
        fireEvent.scroll(scroller());
      };

      it('holds the viewer at the top while a loading attachment tries to scroll it away', async () => {
        await openViewer([mockMultiAttachmentDocument]);

        jumpTo(900);

        expect(scroller().scrollTop).toBe(0);
      });

      it('lets the user scroll once they have scrolled themselves', async () => {
        await openViewer([mockMultiAttachmentDocument]);

        fireEvent.wheel(scroller());
        jumpTo(400);

        expect(scroller().scrollTop).toBe(400);
      });

      it('stays held when the user only clicks a button, since a loading attachment can still scroll', async () => {
        await openViewer([mockMultiAttachmentDocument]);

        fireEvent.mouseDown(screen.getByTestId('print-attachment-0'));
        fireEvent.keyDown(screen.getByTestId('print-attachment-0'), {
          key: 'Enter',
        });
        jumpTo(900);

        expect(scroller().scrollTop).toBe(0);
      });

      it.each([
        ['dragging the scrollbar', () => fireEvent.mouseDown(scroller())],
        [
          'a navigation key pressed on the viewer',
          () => fireEvent.keyDown(scroller(), { key: 'PageDown' }),
        ],
      ])('is released by %s', async (_label, release) => {
        await openViewer([mockMultiAttachmentDocument]);

        release();
        jumpTo(300);

        expect(scroller().scrollTop).toBe(300);
      });
    });
  });

  describe('Add document action', () => {
    const addAction = {
      type: 'add',
      label: 'DOCUMENTS_ADD_ACTION',
      encounterType: 'Patient Document',
      editTitle: 'DOCUMENTS_UPLOAD_TITLE',
      requiredPrivilege: ['Add Encounters'],
    };

    it('does not render the add button when no action is configured', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());

      renderComponent({ config: defaultConfig });

      expect(screen.queryByTestId('documents-add-button')).toBeNull();
    });

    it('hides the add button without the required privilege', () => {
      (useHasPrivilege as jest.Mock).mockReturnValue(false);
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());

      renderComponent({ config: { ...defaultConfig, actions: [addAction] } });

      expect(screen.queryByTestId('documents-add-button')).toBeNull();
    });

    it('shows the add button in the widget header next to the title', () => {
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());

      renderComponent({ config: { ...defaultConfig, actions: [addAction] } });

      expect(screen.getByTestId('documents-header')).toContainElement(
        screen.getByTestId('documents-add-button'),
      );
    });

    it('dispatches startConsultation for the documents control on click', async () => {
      const user = userEvent.setup();
      const listener = jest.fn();
      globalThis.addEventListener('startConsultation', listener);
      (useQuery as jest.Mock).mockReturnValue(mockQueryData());

      renderComponent({ config: { ...defaultConfig, actions: [addAction] } });
      await user.click(screen.getByTestId('documents-add-button'));

      globalThis.removeEventListener('startConsultation', listener);
      expect(listener).toHaveBeenCalledTimes(1);
      expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
        encounterType: 'Patient Document',
        editOnly: 'documents',
        editTitle: 'DOCUMENTS_UPLOAD_TITLE',
      });
    });
  });

  describe('Refresh after consultation saved', () => {
    it('refetches when documents were saved for this patient', () => {
      const refetch = jest.fn();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockPdfDocument], { refetch }),
      );

      renderComponent({ config: defaultConfig });
      const handler = (useSubscribeConsultationSaved as jest.Mock).mock
        .calls[0][0];

      handler({
        patientUUID: 'other-patient',
        updatedResources: { documents: true },
      });
      handler({
        patientUUID: 'test-patient-uuid',
        updatedResources: { documents: false },
      });
      expect(refetch).not.toHaveBeenCalled();

      handler({
        patientUUID: 'test-patient-uuid',
        updatedResources: { documents: true },
      });
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Notes', () => {
    it('shows a notes tooltip only for documents with a description', () => {
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([
          { ...mockPdfDocument, description: 'Signed by patient' },
          mockImageDocument,
        ]),
      );

      renderComponent({ config: defaultConfig });

      expect(screen.getByTestId('document-notes-doc-1')).toBeInTheDocument();
      expect(screen.queryByTestId('document-notes-doc-2')).toBeNull();
    });
  });

  describe('Printing', () => {
    const finishLoadingAttachments = () => {
      document
        .querySelectorAll(
          '[data-testid="document-view-modal"] img, [data-testid="document-view-modal"] iframe',
        )
        .forEach((element) => fireEvent.load(element));
    };

    beforeEach(() => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });
    });

    it('prints a single pdf attachment through the pdf printer', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));

      renderComponent({ config: defaultConfig });
      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
      finishLoadingAttachments();
      await user.click(await screen.findByTestId('print-attachment-0'));

      expect(printPdfViaIframe).toHaveBeenCalledTimes(1);
      expect(printPdfViaIframe).toHaveBeenCalledWith(
        'http://localhost/openmrs/auth?requested_document=/document_images/100/test-document.pdf',
        {
          container: expect.any(HTMLElement),
          focus: false,
          signal: expect.any(AbortSignal),
        },
      );
      expect(printViaIframe).not.toHaveBeenCalled();
      expect(screen.queryByTestId('print-all-attachments')).toBeNull();
      const { container } = (printPdfViaIframe as jest.Mock).mock.calls[0][1];
      expect(container).toHaveClass('cds--modal-container');
      expect(container).toContainElement(
        screen.getByTestId('print-attachment-0'),
      );
    });

    it('prints an image attachment through the same helper as the registration card', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([mockImageDocument]),
      );

      renderComponent({ config: defaultConfig });
      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
      finishLoadingAttachments();
      await user.click(await screen.findByTestId('print-attachment-0'));

      expect(printViaIframe).toHaveBeenCalledTimes(1);
      const [html, options] = (printViaIframe as jest.Mock).mock.calls[0];
      expect(html).toContain('100/xray-image.jpg');
      expect(html).toContain('X-Ray Image');
      expect(options).toEqual({
        container: expect.any(HTMLElement),
        focus: false,
        signal: expect.any(AbortSignal),
      });
      expect(options.container).toHaveClass('cds--modal-container');
      expect(printPdfViaIframe).not.toHaveBeenCalled();
    });

    it('opens a separate print preview for each file, in order, when printing all', async () => {
      const user = userEvent.setup();
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([
          {
            ...mockMultiAttachmentDocument,
            attachments: [
              { url: '100/a.jpg', contentType: 'image/jpeg' },
              { url: '100/b.pdf', contentType: 'application/pdf' },
              { url: '100/c.png', contentType: 'image/png' },
            ],
          },
        ]),
      );

      renderComponent({ config: defaultConfig });
      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
      finishLoadingAttachments();
      await user.click(await screen.findByTestId('print-all-attachments'));

      await waitFor(() => expect(printViaIframe).toHaveBeenCalledTimes(2));
      expect(printPdfViaIframe).toHaveBeenCalledTimes(1);
      const [first, second] = (printViaIframe as jest.Mock).mock.calls;
      expect(first[0]).toContain('a.jpg');
      expect(first[0]).not.toContain('c.png');
      expect(second[0]).toContain('c.png');
      expect(second[0]).not.toContain('a.jpg');
      expect(
        (printViaIframe as jest.Mock).mock.invocationCallOrder[0],
      ).toBeLessThan(
        (printPdfViaIframe as jest.Mock).mock.invocationCallOrder[0],
      );
      expect(
        (printPdfViaIframe as jest.Mock).mock.invocationCallOrder[0],
      ).toBeLessThan((printViaIframe as jest.Mock).mock.invocationCallOrder[1]);
    });

    it('opens the next preview only after the previous print dialog has closed', async () => {
      const user = userEvent.setup();
      let closeFirst: () => void = () => {};
      (printViaIframe as jest.Mock).mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            closeFirst = resolve;
          }),
      );
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([
          {
            ...mockMultiAttachmentDocument,
            attachments: [
              { url: '100/a.jpg', contentType: 'image/jpeg' },
              { url: '100/c.png', contentType: 'image/png' },
            ],
          },
        ]),
      );

      renderComponent({ config: defaultConfig });
      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
      finishLoadingAttachments();
      await user.click(await screen.findByTestId('print-all-attachments'));

      expect(printViaIframe).toHaveBeenCalledTimes(1);

      await act(async () => closeFirst());

      await waitFor(() => expect(printViaIframe).toHaveBeenCalledTimes(2));
    });

    it('stops and tells the user when one of the files cannot be printed', async () => {
      const user = userEvent.setup();
      (printViaIframe as jest.Mock).mockRejectedValueOnce(new Error('boom'));
      (useQuery as jest.Mock).mockReturnValue(
        mockQueryData([
          {
            ...mockMultiAttachmentDocument,
            attachments: [
              { url: '100/a.jpg', contentType: 'image/jpeg' },
              { url: '100/c.png', contentType: 'image/png' },
            ],
          },
        ]),
      );

      renderComponent({ config: defaultConfig });
      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
      finishLoadingAttachments();
      await user.click(await screen.findByTestId('print-all-attachments'));

      await waitFor(() =>
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'DOCUMENTS_ERROR_LOADING_ATTACHMENT',
          }),
        ),
      );
      expect(printViaIframe).toHaveBeenCalledTimes(1);
    });

    describe('while a print is being prepared', () => {
      let finishPrint: () => void;

      const openMultiAttachmentViewer = async (user: UserEvent) => {
        (useQuery as jest.Mock).mockReturnValue(
          mockQueryData([
            {
              ...mockMultiAttachmentDocument,
              attachments: [
                { url: '100/a.jpg', contentType: 'image/jpeg' },
                { url: '100/b.png', contentType: 'image/png' },
              ],
            },
          ]),
        );
        renderComponent({ config: defaultConfig });
        await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
        finishLoadingAttachments();
      };

      beforeEach(() => {
        let calls = 0;
        (printViaIframe as jest.Mock).mockImplementation(() => {
          calls += 1;
          return calls % 2 === 1
            ? new Promise<void>((resolve) => {
                finishPrint = resolve;
              })
            : Promise.resolve();
        });
      });

      it('disables the print buttons until the print is done', async () => {
        const user = userEvent.setup();
        await openMultiAttachmentViewer(user);

        await user.click(await screen.findByTestId('print-all-attachments'));

        expect(screen.getByTestId('print-all-attachments')).toBeDisabled();
        expect(screen.getByTestId('print-attachment-0')).toBeDisabled();

        await act(async () => finishPrint());

        expect(screen.getByTestId('print-all-attachments')).toBeEnabled();
        expect(screen.getByTestId('print-attachment-0')).toBeEnabled();
      });

      it.each([
        ['print-attachment-1', ['print-attachment-0', 'print-all-attachments']],
        ['print-all-attachments', ['print-attachment-0', 'print-attachment-1']],
      ])(
        'shows which button is working: a spinner in place of its printer icon, on %s only',
        async (started, others) => {
          const user = userEvent.setup();
          await openMultiAttachmentViewer(user);
          const spinnerIn = (testId: string) =>
            screen.getByTestId(testId).querySelector('.cds--inline-loading');

          await user.click(await screen.findByTestId(started));

          expect(spinnerIn(started)).not.toBeNull();
          others.forEach((other) => expect(spinnerIn(other)).toBeNull());

          await act(async () => finishPrint());

          expect(spinnerIn(started)).toBeNull();
        },
      );

      it('prints again once the first print has finished', async () => {
        const user = userEvent.setup();
        await openMultiAttachmentViewer(user);

        await user.click(await screen.findByTestId('print-all-attachments'));
        await act(async () => finishPrint());
        await user.click(screen.getByTestId('print-all-attachments'));

        expect(printViaIframe).toHaveBeenCalledTimes(3);
      });

      it('abandons the print when the viewer is closed, so the next one can start', async () => {
        const user = userEvent.setup();
        await openMultiAttachmentViewer(user);
        await user.click(await screen.findByTestId('print-all-attachments'));
        const { signal } = (printViaIframe as jest.Mock).mock.calls[0][1];

        await user.click(screen.getByRole('button', { name: /close/i }));
        await act(async () => finishPrint());

        expect(signal.aborted).toBe(true);
        expect(printViaIframe).toHaveBeenCalledTimes(1);

        await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
        finishLoadingAttachments();

        expect(
          await screen.findByTestId('print-all-attachments'),
        ).toBeEnabled();
      });

      it('lets printing be retried after a failure', async () => {
        const user = userEvent.setup();
        (printViaIframe as jest.Mock).mockRejectedValueOnce(new Error('boom'));
        await openMultiAttachmentViewer(user);

        await user.click(await screen.findByTestId('print-all-attachments'));

        await waitFor(() =>
          expect(screen.getByTestId('print-all-attachments')).toBeEnabled(),
        );
      });
    });

    it('tells the user when printing fails', async () => {
      const user = userEvent.setup();
      (printPdfViaIframe as jest.Mock).mockRejectedValueOnce(new Error('404'));
      (useQuery as jest.Mock).mockReturnValue(mockQueryData([mockPdfDocument]));

      renderComponent({ config: defaultConfig });
      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
      finishLoadingAttachments();
      await user.click(await screen.findByTestId('print-attachment-0'));

      await waitFor(() =>
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'DOCUMENTS_ERROR_LOADING_ATTACHMENT',
            type: 'error',
          }),
        ),
      );
    });
  });
});
