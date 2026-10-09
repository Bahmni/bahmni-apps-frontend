import {
  downloadBlob,
  exportConceptSet,
  getConceptById,
  searchConceptsByQuery,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { CsvExport } from '../CsvExport';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  searchConceptsByQuery: jest.fn(),
  exportConceptSet: jest.fn(),
  getConceptById: jest.fn(),
  downloadBlob: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(),
}));

jest.mock('../../components/AdminLayout', () => ({
  AdminLayout: ({
    children,
    breadcrumbLabel,
  }: {
    children: React.ReactNode;
    breadcrumbLabel?: string;
  }) => (
    <div data-testid="admin-layout-test-id">
      <nav>
        <span data-testid="current-page-crumb">{breadcrumbLabel}</span>
      </nav>
      {children}
    </div>
  ),
}));

const mockAddNotification = jest.fn();
const mockSearch = searchConceptsByQuery as jest.Mock;
const mockExport = exportConceptSet as jest.Mock;
const mockDownload = downloadBlob as jest.Mock;
const mockGetConcept = getConceptById as jest.Mock;

const conceptResults = [
  { uuid: 'uuid-1', name: { name: 'Vital signs' } },
  { uuid: 'uuid-2', name: { name: 'Vitamin level' } },
];

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CsvExport />
    </QueryClientProvider>,
  );
};

const getInput = () => screen.getByRole('combobox');
const getExportButton = () => screen.getByTestId('csv-export-button-test-id');

const typeSearch = async (value: string) => {
  fireEvent.change(getInput(), { target: { value } });
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
};

const selectConcept = async (name: string) => {
  await typeSearch('vit');
  const option = await screen.findByRole('option', { name });
  fireEvent.click(option);
};

describe('CsvExport', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    mockSearch.mockResolvedValue(conceptResults);
    mockGetConcept.mockResolvedValue({ setMembers: [{ uuid: 'member-1' }] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the title, search box and export button inside the admin layout', () => {
    renderPage();

    const layout = screen.getByTestId('admin-layout-test-id');
    expect(layout).toContainElement(
      screen.getByTestId('admin-csv-export-page-test-id'),
    );
    expect(screen.getByText('Concept CSV Export')).toBeInTheDocument();
    expect(getInput()).toHaveAttribute('placeholder', 'Enter a concept name');
    expect(getExportButton()).toHaveTextContent('Export');
  });

  it('passes CSV Export as the current page to the admin layout', () => {
    renderPage();

    expect(screen.getByTestId('current-page-crumb')).toHaveTextContent(
      'CSV Export',
    );
  });

  it('debounces the concept search by 300ms', async () => {
    renderPage();

    fireEvent.change(getInput(), { target: { value: 'vit' } });
    await act(async () => {
      jest.advanceTimersByTime(299);
    });
    expect(mockSearch).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith('vit');
    expect(
      await screen.findByRole('option', { name: 'Vital signs' }),
    ).toBeInTheDocument();
  });

  it('only searches once after the user stops typing', async () => {
    renderPage();

    fireEvent.change(getInput(), { target: { value: 'vi' } });
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    fireEvent.change(getInput(), { target: { value: 'vit' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith('vit');
  });

  it('does not search for fewer than 2 characters', async () => {
    renderPage();

    await typeSearch('v');

    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('skips search results that have no name', async () => {
    mockSearch.mockResolvedValue([
      { uuid: 'uuid-1', name: { name: 'Vital signs' } },
      { uuid: 'uuid-3', name: null },
    ]);
    renderPage();

    await typeSearch('vit');

    expect(
      await screen.findByRole('option', { name: 'Vital signs' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('keeps previous options visible while the next search is loading', async () => {
    // ComboBox scrolls the highlighted option into view, which jsdom does not implement
    Element.prototype.scrollIntoView = jest.fn();
    renderPage();
    await typeSearch('vit');
    await screen.findByRole('option', { name: 'Vital signs' });

    mockSearch.mockReturnValue(new Promise(() => {}));
    await typeSearch('vita');

    expect(mockSearch).toHaveBeenLastCalledWith('vita');
    expect(
      screen.getByRole('option', { name: 'Vital signs' }),
    ).toBeInTheDocument();
  });

  it('shows a validation error and blocks export when no concept is selected', () => {
    renderPage();

    fireEvent.click(getExportButton());

    expect(mockExport).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'No concept selected',
      }),
    );
  });

  it('blocks export when typed text was not picked from the dropdown', async () => {
    renderPage();

    await typeSearch('Vital signs');
    fireEvent.click(getExportButton());

    expect(mockExport).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'No concept selected' }),
    );
  });

  it('keeps the typed text when the search box loses focus', async () => {
    renderPage();

    await typeSearch('Vital');
    fireEvent.blur(getInput());

    expect(getInput()).toHaveValue('Vital');

    fireEvent.click(getExportButton());
    expect(mockGetConcept).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'No concept selected' }),
    );
  });

  it('downloads the zip and shows a success notification when the export has data', async () => {
    const blob = new Blob(['zip-bytes'], { type: 'application/zip' });
    mockExport.mockResolvedValue(blob);
    renderPage();

    await selectConcept('Vital signs');
    await act(async () => {
      fireEvent.click(getExportButton());
    });

    expect(mockGetConcept).toHaveBeenCalledWith(
      'uuid-1',
      'custom:(uuid,setMembers:(uuid))',
    );
    expect(mockExport).toHaveBeenCalledWith('Vital signs');
    expect(mockDownload).toHaveBeenCalledWith(blob, 'Vital signs.zip');
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Export complete',
        message: 'Vital signs was exported successfully.',
      }),
    );
  });

  it('shows an error and skips the export when the concept set has no members', async () => {
    mockGetConcept.mockResolvedValue({ setMembers: [] });
    renderPage();

    await selectConcept('Vital signs');
    await act(async () => {
      fireEvent.click(getExportButton());
    });

    expect(mockGetConcept).toHaveBeenCalledWith(
      'uuid-1',
      'custom:(uuid,setMembers:(uuid))',
    );
    expect(mockExport).not.toHaveBeenCalled();
    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'No data to export',
      }),
    );
  });

  it('shows an error and downloads nothing when the export returns an empty file', async () => {
    mockExport.mockResolvedValue(new Blob([]));
    renderPage();

    await selectConcept('Vital signs');
    await act(async () => {
      fireEvent.click(getExportButton());
    });

    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'No data to export',
      }),
    );
  });

  it('shows an error notification and skips the export when the concept lookup fails', async () => {
    mockGetConcept.mockRejectedValue(new Error('Concept not found'));
    renderPage();

    await selectConcept('Vital signs');
    await act(async () => {
      fireEvent.click(getExportButton());
    });

    expect(mockExport).not.toHaveBeenCalled();
    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Export failed',
        message: 'Concept not found',
      }),
    );
  });

  it('shows an error notification when the export request fails', async () => {
    mockExport.mockRejectedValue(new Error('Server error'));
    renderPage();

    await selectConcept('Vital signs');
    await act(async () => {
      fireEvent.click(getExportButton());
    });

    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Export failed',
        message: 'Server error',
      }),
    );
  });

  it('disables the button and shows a loading indicator while exporting', async () => {
    let resolveExport: (blob: Blob) => void = () => undefined;
    mockExport.mockImplementation(
      () =>
        new Promise<Blob>((resolve) => {
          resolveExport = resolve;
        }),
    );
    renderPage();

    await selectConcept('Vital signs');
    await act(async () => {
      fireEvent.click(getExportButton());
      jest.runOnlyPendingTimers();
    });

    expect(getExportButton()).toBeDisabled();
    expect(
      screen.getByTestId('csv-export-loading-test-id'),
    ).toBeInTheDocument();

    fireEvent.click(getExportButton());
    expect(mockExport).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveExport(new Blob(['zip-bytes']));
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(getExportButton()).not.toBeDisabled();
    expect(getExportButton()).toHaveTextContent('Export');
  });
});
