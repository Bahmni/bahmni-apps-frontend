import { ImportedItem } from '@bahmni/services';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useCsvUpload } from '../../hooks/useCsvUpload';
import { useImportedItems } from '../../hooks/useImportedItems';
import { CsvUpload } from '../CsvUpload';

jest.mock('../../components/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout-test-id">{children}</div>
  ),
}));
jest.mock('../../hooks/useCsvUpload');
jest.mock('../../hooks/useImportedItems');

const mockUseCsvUpload = useCsvUpload as jest.MockedFunction<
  typeof useCsvUpload
>;
const mockUseImportedItems = useImportedItems as jest.Mock;
const mockUpload = jest.fn();

const item = (overrides: Partial<ImportedItem>): ImportedItem => ({
  id: '1',
  originalFileName: 'concept.csv',
  savedFileName: null,
  errorFileName: null,
  type: null,
  status: 'COMPLETED',
  successfulRecords: 1,
  failedRecords: 0,
  stageName: null,
  uploadedBy: null,
  startTime: new Date('2026-10-01T07:50:00Z').getTime(),
  endTime: null,
  stackTrace: null,
  errorMessage: null,
  ...overrides,
});

const setHooks = (
  items: ImportedItem[] = [],
  uploadState: ReturnType<typeof useCsvUpload>['uploadState'] = null,
) => {
  mockUseImportedItems.mockReturnValue({
    data: items,
    isLoading: false,
    isError: false,
  });
  mockUseCsvUpload.mockReturnValue({
    upload: mockUpload,
    uploadState,
    isUploading: uploadState !== null,
  });
};

const chooseType = async (label: string) => {
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(await screen.findByText(label));
};

describe('CsvUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHooks();
  });

  it('renders inside the admin layout with the empty state', () => {
    render(<CsvUpload />);

    expect(screen.getByTestId('admin-layout-test-id')).toContainElement(
      screen.getByTestId('admin-csv-upload-page-test-id'),
    );
    expect(screen.getByText('No files uploaded')).toBeInTheDocument();
  });

  it('lists all 11 import types in the dropdown', async () => {
    render(<CsvUpload />);

    fireEvent.click(screen.getByRole('combobox'));

    expect(await screen.findAllByRole('option')).toHaveLength(11);
  });

  it('disables Upload Files until a type is chosen', async () => {
    render(<CsvUpload />);
    const button = screen.getByTestId('admin-csv-upload-button');
    expect(button).toBeDisabled();

    await chooseType('Concept');

    expect(button).toBeEnabled();
  });

  it('opens the file picker when Upload Files is clicked', async () => {
    render(<CsvUpload />);
    const input = screen.getByTestId('admin-csv-file-input');
    const click = jest.spyOn(input, 'click');
    await chooseType('Concept');

    fireEvent.click(screen.getByTestId('admin-csv-upload-button'));

    expect(click).toHaveBeenCalled();
    expect(input).toHaveAttribute('multiple');
  });

  it('uploads the chosen files with the selected type', async () => {
    render(<CsvUpload />);
    await chooseType('Drug');
    const files = [new File(['a'], 'a.csv'), new File(['b'], 'b.csv')];

    fireEvent.change(screen.getByTestId('admin-csv-file-input'), {
      target: { files },
    });

    expect(mockUpload).toHaveBeenCalledWith(
      files,
      expect.objectContaining({
        key: 'drug',
        url: '/openmrs/ws/rest/v1/bahmnicore/admin/upload/drug',
      }),
    );
  });

  it('shows progress and locks the controls while uploading', () => {
    setHooks([], {
      fileName: 'big.csv',
      fileIndex: 2,
      fileCount: 3,
      percent: 40,
      showProgress: true,
    });
    render(<CsvUpload />);

    expect(screen.getByText('Uploading big.csv (2 of 3)')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByTestId('admin-csv-upload-button')).toBeDisabled();
  });

  it('hides progress but still locks the controls for small files', () => {
    setHooks([], {
      fileName: 'small.csv',
      fileIndex: 1,
      fileCount: 1,
      percent: 40,
      showProgress: false,
    });
    render(<CsvUpload />);

    expect(
      screen.queryByTestId('admin-csv-upload-progress'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('admin-csv-upload-button')).toBeDisabled();
  });

  it('renders history rows: error message, summary for partial failure, error file link', () => {
    setHooks([
      item({ id: '1', originalFileName: 'ok.csv' }),
      item({
        id: '2',
        originalFileName: 'bad.csv',
        status: 'ERROR',
        errorMessage: 'No Column found in the csv file. Generic Name',
      }),
      item({
        id: '3',
        originalFileName: 'partial.csv',
        status: 'COMPLETED_WITH_ERRORS',
        failedRecords: 2,
        errorFileName: 'partial-err.csv',
      }),
    ]);
    render(<CsvUpload />);

    const table = screen.getByTestId('admin-csv-uploaded-files-table');
    expect(
      within(table).getByText('No Column found in the csv file. Generic Name'),
    ).toBeInTheDocument();
    expect(
      within(table).getByText(
        'Some records failed. Download the Error File for details.',
      ),
    ).toBeInTheDocument();
    const links = within(table).getAllByRole('link', { name: 'Error File' });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute(
      'href',
      '/uploaded-files/mrs/partial-err.csv',
    );
  });
});
