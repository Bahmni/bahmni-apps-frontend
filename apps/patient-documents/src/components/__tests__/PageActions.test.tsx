import { fireEvent, render, screen } from '@testing-library/react';
import { PageActions } from '../PageActions';

const mockUsePendingDocuments = jest.fn();

// The pending-documents provider has its own suite; stub it here so this suite can drive
// pendingCount directly without wiring up real uploads.
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  usePendingDocuments: () => mockUsePendingDocuments(),
  SaveDocumentsButton: () => <button data-testid="save-documents">Save</button>,
}));

const SEARCH_HREF =
  '/bahmni/document-upload/?encounterType=Patient%20Document#/search';

describe('PageActions', () => {
  const originalLocation = window.location;

  // jsdom cannot navigate, so stand in a plain object and read back the assigned href.
  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  it('renders Back and Save side by side', () => {
    mockUsePendingDocuments.mockReturnValue({ pendingCount: 0 });
    render(<PageActions searchHref={SEARCH_HREF} />);

    expect(screen.getByTestId('back-to-search')).toBeInTheDocument();
    expect(screen.getByTestId('save-documents')).toBeInTheDocument();
  });

  it('navigates immediately when there are no pending documents', () => {
    mockUsePendingDocuments.mockReturnValue({ pendingCount: 0 });
    render(<PageActions searchHref={SEARCH_HREF} />);

    fireEvent.click(screen.getByTestId('back-to-search'));

    expect(window.location.href).toBe(SEARCH_HREF);
    expect(
      screen.queryByTestId('patient-documents-unsaved-modal-test-id'),
    ).not.toBeInTheDocument();
  });

  it('opens a confirm dialog instead of navigating when documents are pending', () => {
    mockUsePendingDocuments.mockReturnValue({ pendingCount: 2 });
    render(<PageActions searchHref={SEARCH_HREF} />);

    fireEvent.click(screen.getByTestId('back-to-search'));

    expect(window.location.href).toBe('');
    expect(
      screen.getByTestId('patient-documents-unsaved-modal-test-id'),
    ).toBeInTheDocument();
  });

  it('Stay closes the dialog without navigating, preserving the pending documents', () => {
    mockUsePendingDocuments.mockReturnValue({ pendingCount: 2 });
    render(<PageActions searchHref={SEARCH_HREF} />);

    fireEvent.click(screen.getByTestId('back-to-search'));
    fireEvent.click(screen.getByText('Stay'));

    expect(window.location.href).toBe('');
    expect(
      screen.queryByTestId('patient-documents-unsaved-modal-test-id'),
    ).not.toBeInTheDocument();
    // Back is still available to try again, and pending count is untouched by this component.
    expect(screen.getByTestId('back-to-search')).toBeInTheDocument();
    expect(mockUsePendingDocuments).toHaveBeenCalled();
  });

  it('Leave navigates to the search href', () => {
    mockUsePendingDocuments.mockReturnValue({ pendingCount: 2 });
    render(<PageActions searchHref={SEARCH_HREF} />);

    fireEvent.click(screen.getByTestId('back-to-search'));
    fireEvent.click(screen.getByText('Leave'));

    expect(window.location.href).toBe(SEARCH_HREF);
  });
});
