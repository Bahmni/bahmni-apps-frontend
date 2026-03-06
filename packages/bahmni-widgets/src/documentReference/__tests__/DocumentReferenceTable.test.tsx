import { formatDate } from '@bahmni/services';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import {
  createQueryClient,
  mockConfig,
  mockDocumentReferenceViewModels,
  mockDocumentReferenceWithMissingValues,
  mockSingleDocumentReference,
  mockDocumentReferenceWithAttachments,
} from '../__mocks__/mocks';
import DocumentReferenceTable from '../DocumentReferenceTable';

expect.extend(toHaveNoViolations);

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDate: jest.fn(),
}));
jest.mock('../../hooks/usePatientUUID');

describe('DocumentReferenceTable', () => {
  const queryClient = createQueryClient();

  const createWrapper = (config = mockConfig) => (
    <QueryClientProvider client={queryClient}>
      <DocumentReferenceTable config={config} />
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientUUID as jest.Mock).mockReturnValue('patient-123');
    (formatDate as jest.Mock).mockImplementation((date) => ({
      formattedResult: date ? '15/01/2020' : '-',
    }));
  });

  afterEach(() => {
    queryClient.clear();
  });

  it.each([
    {
      state: 'loading',
      queryReturn: { data: null, error: null, isError: false, isLoading: true },
      expectation: () =>
        expect(
          screen.getByTestId('patient-document-reference-table-test-id'),
        ).toBeInTheDocument(),
    },
    {
      state: 'error',
      queryReturn: {
        data: null,
        error: new Error('An unexpected error occurred'),
        isError: true,
        isLoading: false,
      },
      expectation: () =>
        expect(
          screen.getByText('DOCUMENT_REFERENCE_TABLE_ERROR_STATE'),
        ).toBeInTheDocument(),
    },
    {
      state: 'empty',
      queryReturn: { data: [], error: null, isError: false, isLoading: false },
      expectation: () =>
        expect(
          screen.getByText('DOCUMENT_REFERENCE_TABLE_EMPTY_STATE'),
        ).toBeInTheDocument(),
    },
  ])('should show $state state', ({ queryReturn, expectation }) => {
    (useQuery as jest.Mock).mockReturnValue(queryReturn);
    render(createWrapper());
    expectation();
  });

  it('should display document references correctly', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockDocumentReferenceViewModels,
      error: null,
      isError: false,
      isLoading: false,
    });

    render(createWrapper());

    expect(
      screen.getByTestId('patient-document-reference-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('P123456')).toBeInTheDocument();
    expect(screen.getByText('National ID')).toBeInTheDocument();
    expect(screen.getByText('N789012')).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'patient-document-reference-table-author-doc-1-test-id',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'patient-document-reference-table-author-doc-1-test-id',
      ),
    ).toHaveTextContent('Super Man');
    expect(
      screen.getByTestId(
        'patient-document-reference-table-author-doc-2-test-id',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'patient-document-reference-table-author-doc-2-test-id',
      ),
    ).toHaveTextContent('Super Man');
  });

  it('should handle missing values gracefully', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockDocumentReferenceWithMissingValues,
      error: null,
      isError: false,
      isLoading: false,
    });

    render(
      createWrapper({
        fields: [
          'documentType',
          'masterIdentifier',
          'issuingDate',
          'expiryDate',
          'issuingCountry',
          'author',
        ],
      }),
    );

    expect(
      screen.getByTestId('patient-document-reference-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('Passport')).toBeInTheDocument();
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
    expect(
      screen.getByTestId(
        'patient-document-reference-table-issuingCountry-doc-1-test-id',
      ),
    ).toHaveTextContent('-');
    expect(
      screen.getByTestId(
        'patient-document-reference-table-author-doc-1-test-id',
      ),
    ).toHaveTextContent('-');
  });

  it('should render ImageTile, VideoTile, and FileTile based on attachment content type', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [mockDocumentReferenceWithAttachments],
      error: null,
      isError: false,
      isLoading: false,
    });

    render(
      createWrapper({
        ...mockConfig,
        fields: ['attachment'],
        hideThumbnail: false,
      }),
    );

    expect(screen.getByTestId('image-attachment-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('video-attachment-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('file-attachment-test-id')).toBeInTheDocument();
  });

  describe('Snapshot and Accessibility', () => {
    it('should match snapshot and pass accessibility tests with document data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockSingleDocumentReference],
        error: null,
        isError: false,
        isLoading: false,
      });
      const { container } = render(createWrapper());

      expect(container).toMatchSnapshot();

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
