import {
  getFormattedDocumentReferences,
  useSubscribeConsultationSaved,
  DEFAULT_DATE_FORMAT_STORAGE_KEY,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import DocumentsTable from '../DocumentsTable';

jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
  getFormattedDocumentReferences: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));

// Mock fetch to simulate successful document loads
globalThis.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
  } as Response),
);

const mockedGetFormattedDocumentReferences =
  getFormattedDocumentReferences as jest.MockedFunction<
    typeof getFormattedDocumentReferences
  >;
const mockAddNotification = jest.fn();

const prescriptionDoc = {
  id: 'doc-1',
  documentIdentifier: 'Prescription_2024',
  documentType: 'Prescription',
  uploadedOn: '2024-01-15T10:30:00Z',
  uploadedBy: 'Dr. Smith',
  contentType: 'application/pdf',
  documentUrl: '100/doc-uuid__prescription.pdf',
  attachments: [
    {
      url: '100/doc-uuid__prescription.pdf',
      contentType: 'application/pdf',
    },
  ],
};

const xrayDoc = {
  id: 'doc-2',
  documentIdentifier: 'XRay_Report_2024',
  documentType: 'Radiology Report',
  uploadedOn: '2024-01-10T14:45:00Z',
  uploadedBy: 'Dr. Williams',
  contentType: 'image/jpeg',
  documentUrl: '100/doc-uuid__xray.jpg',
  attachments: [{ url: '100/doc-uuid__xray.jpg', contentType: 'image/jpeg' }],
};

const labDoc = {
  id: 'doc-3',
  documentIdentifier: 'Lab_Result_2024',
  documentType: 'Lab Result',
  uploadedOn: '2024-01-08T09:00:00Z',
  uploadedBy: 'Dr. Martinez',
  contentType: 'application/pdf',
  documentUrl: '100/doc-uuid__lab.pdf',
  attachments: [
    { url: '100/doc-uuid__lab.pdf', contentType: 'application/pdf' },
  ],
};

const multiAttachmentDoc = {
  id: 'doc-4',
  documentIdentifier: 'MultiPage_Report_2024',
  documentType: 'Lab Result',
  uploadedOn: '2024-01-07T08:00:00Z',
  uploadedBy: 'Dr. Patel',
  contentType: 'application/pdf',
  documentUrl: '100/doc-uuid__multi-p1.pdf',
  attachments: [
    { url: '100/doc-uuid__multi-p1.pdf', contentType: 'application/pdf' },
    { url: '100/doc-uuid__multi-p2.pdf', contentType: 'application/pdf' },
  ],
};

describe('DocumentsTable Integration', () => {
  let queryClient: QueryClient;

  const defaultConfig = {
    fields: [
      'documentIdentifier',
      'documentType',
      'uploadedOn',
      'uploadedBy',
      'action',
    ],
  };

  const renderComponent = (props = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <DocumentsTable {...{ config: defaultConfig, ...props }} />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    localStorage.setItem(DEFAULT_DATE_FORMAT_STORAGE_KEY, 'dd/MM/yyyy');
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('displays patient documents with all clinical information after fetch', async () => {
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
    ]);

    renderComponent();

    expect(screen.getByTestId('documents-table')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    expect(screen.getByText('Prescription')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS')).toBeInTheDocument();
  });

  it('shows empty state when patient has no recorded documents', async () => {
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('DOCUMENTS_NO_RECORDS')).toBeInTheDocument();
    });
  });

  it('shows error notification when document data cannot be fetched', async () => {
    const errorMessage = 'Failed to fetch documents';
    mockedGetFormattedDocumentReferences.mockRejectedValueOnce(
      new Error(errorMessage),
    );

    renderComponent();

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'ERROR_DEFAULT_TITLE',
          message: errorMessage,
        }),
      );
    });
  });

  it('displays multiple documents with "View attachment/s" links (no icons)', async () => {
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
      xrayDoc,
      labDoc,
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();
    expect(screen.getByText('Lab_Result_2024')).toBeInTheDocument();
    expect(screen.getByText('Radiology Report')).toBeInTheDocument();
    expect(screen.getByText('Lab Result')).toBeInTheDocument();

    // Three "View attachment/s" links, one per document
    expect(screen.getAllByText('DOCUMENTS_VIEW_ATTACHMENTS')).toHaveLength(3);

    // No file type icons
    expect(screen.queryByTestId('pdf-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('image-icon')).not.toBeInTheDocument();
  });

  it('opens modal with PDF iframe when "View attachment/s" is clicked', async () => {
    const user = userEvent.setup();
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const iframe = screen.getByTitle('Prescription_2024');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining(
        '/openmrs/auth?requested_document=/document_images/',
      ),
    );
  });

  it('opens modal with img element when image document link is clicked', async () => {
    const user = userEvent.setup();
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([xrayDoc]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();
    });

    await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const image = screen.getByRole('img', { name: 'XRay_Report_2024' });
    expect(image).toBeInTheDocument();
  });

  it('shows all attachments in modal for a document with multiple content entries', async () => {
    const user = userEvent.setup();
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      multiAttachmentDoc,
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('MultiPage_Report_2024')).toBeInTheDocument();
    });

    await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Both attachments rendered as iframes
    const iframes = screen.getAllByTitle('MultiPage_Report_2024');
    expect(iframes).toHaveLength(2);
    // Counter labels visible
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });

  it('closes modal after clicking close button', async () => {
    const user = userEvent.setup();
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('passes encounterUuids filter to service when provided', async () => {
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
    ]);

    const encounterUuids = ['encounter-uuid-1', 'encounter-uuid-2'];
    renderComponent({ encounterUuids });

    await waitFor(() => {
      expect(mockedGetFormattedDocumentReferences).toHaveBeenCalledWith(
        'test-patient-uuid',
        encounterUuids,
      );
    });
  });

  it('calls service without encounter filter when encounterUuids is not provided', async () => {
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
    ]);

    renderComponent();

    await waitFor(() => {
      expect(mockedGetFormattedDocumentReferences).toHaveBeenCalledWith(
        'test-patient-uuid',
        undefined,
      );
    });
  });

  it('renders documents in the order returned by the service (latest first)', async () => {
    // API returns sorted by _sort=-date (latest first):
    // prescriptionDoc: Jan 15, xrayDoc: Jan 10
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
      xrayDoc,
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    // rows[0] is the header row; data rows start at index 1
    expect(rows[1]).toHaveTextContent('Prescription_2024');
    expect(rows[2]).toHaveTextContent('XRay_Report_2024');
  });

  it('accepts and passes pageSize configuration to SortableDataTable', async () => {
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
      xrayDoc,
      labDoc,
    ]);

    // Render with pageSize configuration
    renderComponent({ config: { ...defaultConfig, pageSize: 2 } });

    await waitFor(() => {
      expect(screen.getByTestId('documents-table')).toBeInTheDocument();
    });

    // Component should render successfully with pageSize config
    const table = screen.getByTestId('documents-table');
    expect(table).toBeInTheDocument();
  });

  it('documents are fetched correctly when pageSize is configured', async () => {
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
      xrayDoc,
      labDoc,
    ]);

    // Render with pageSize=2
    renderComponent({ config: { ...defaultConfig, pageSize: 2 } });

    await waitFor(() => {
      expect(mockedGetFormattedDocumentReferences).toHaveBeenCalled();
    });

    // All documents should be fetched by the service
    expect(mockedGetFormattedDocumentReferences).toHaveBeenCalledWith(
      'test-patient-uuid',
      undefined,
    );
  });

  it('renders documents correctly without pageSize configuration', async () => {
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
      xrayDoc,
      labDoc,
    ]);

    // Render with default config (no pageSize)
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('documents-table')).toBeInTheDocument();
    });

    // All 3 documents should be fetchable from service
    expect(mockedGetFormattedDocumentReferences).toHaveBeenCalled();
  });

  it('does not refetch documents when consultation saved for a different patient', async () => {
    let capturedCallback: ((payload: any) => void) | undefined;
    (useSubscribeConsultationSaved as jest.Mock).mockImplementation(
      (cb: (payload: any) => void) => {
        capturedCallback = cb;
      },
    );

    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    act(() => {
      capturedCallback?.({ patientUUID: 'different-patient-uuid' });
    });

    await act(async () => {});

    expect(mockedGetFormattedDocumentReferences).toHaveBeenCalledTimes(1);
  });

  it('does not call the API when patientUUID is null', async () => {
    (usePatientUUID as jest.Mock).mockReturnValue(null);
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([]);

    renderComponent();

    // Wait a render cycle to ensure no query fires
    await act(async () => {});

    expect(mockedGetFormattedDocumentReferences).not.toHaveBeenCalled();
  });
});
