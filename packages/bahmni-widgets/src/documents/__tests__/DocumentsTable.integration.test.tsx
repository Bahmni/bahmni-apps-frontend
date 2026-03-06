import {
  getFormattedDocumentReferences,
  useSubscribeConsultationSaved,
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
  formatDate: () => ({ formattedResult: '2024-01-15 10:30 AM' }),
  getFormattedDocumentReferences: jest.fn(),
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
};

const xrayDoc = {
  id: 'doc-2',
  documentIdentifier: 'XRay_Report_2024',
  documentType: 'Radiology Report',
  uploadedOn: '2024-01-10T14:45:00Z',
  uploadedBy: 'Dr. Williams',
  contentType: 'image/jpeg',
  documentUrl: '100/doc-uuid__xray.jpg',
};

const labDoc = {
  id: 'doc-3',
  documentIdentifier: 'Lab_Result_2024',
  documentType: 'Lab Result',
  uploadedOn: '2024-01-08T09:00:00Z',
  uploadedBy: 'Dr. Martinez',
  contentType: 'application/pdf',
  documentUrl: '100/doc-uuid__lab.pdf',
};

describe('DocumentsTable Integration', () => {
  let queryClient: QueryClient;

  const defaultConfig = {
    fields: ['documentIdentifier', 'documentType', 'uploadedOn', 'uploadedBy'],
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
    expect(screen.getByTestId('pdf-icon')).toBeInTheDocument();
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

  it('displays multiple documents with correct icons', async () => {
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
    expect(screen.getAllByTestId('pdf-icon')).toHaveLength(2);
    expect(screen.getByTestId('image-icon')).toBeInTheDocument();
  });

  it('opens modal with PDF iframe when icon button is clicked', async () => {
    const user = userEvent.setup();
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([
      prescriptionDoc,
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: 'View Prescription_2024' }),
    );

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

  it('opens modal with img element when image icon button is clicked', async () => {
    const user = userEvent.setup();
    mockedGetFormattedDocumentReferences.mockResolvedValueOnce([xrayDoc]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: 'View XRay_Report_2024' }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const image = screen.getByRole('img', { name: 'XRay_Report_2024' });
    expect(image).toBeInTheDocument();
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

    await user.click(
      screen.getByRole('button', { name: 'View Prescription_2024' }),
    );
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
    // fhirPrescriptionDoc: Jan 15, fhirXrayDoc: Jan 10
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
