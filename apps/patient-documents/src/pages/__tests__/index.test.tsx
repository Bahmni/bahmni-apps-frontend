import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { IndexPage } from '../Index';

const mockHeaderProps = jest.fn();
const mockAddNotification = jest.fn();
const mockProviderProps = jest.fn();

// The pending-documents machinery has its own suite; stub it so this test can assert the wiring.
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  PatientDetails: () => <div data-testid="patient-details-mock" />,
  usePatientUUID: jest.fn(() => 'patient-uuid'),
  useNotification: () => ({ addNotification: mockAddNotification }),
  PendingDocumentsProvider: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => {
    mockProviderProps(props);
    return <div data-testid="pending-documents-provider">{children}</div>;
  },
  SaveDocumentsButton: () => (
    <button data-testid="save-documents">DOCUMENT_UPLOAD_SAVE</button>
  ),
  // PageActions calls this directly (for the unsaved-changes gate); PendingDocumentsProvider above
  // is a stub, not the real context, so the real hook would otherwise throw outside a provider.
  usePendingDocuments: () => ({ pendingCount: 0 }),
}));

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  Header: (props: any) => {
    mockHeaderProps(props);
    return <div data-testid="header-mock" />;
  },
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFormattedPatientById: jest
    .fn()
    .mockResolvedValue({ fullName: 'Naman Shukla' }),
  getDocumentTypes: jest
    .fn()
    .mockResolvedValue([{ id: 'type-1', label: 'Prescription' }]),
}));

jest.mock('../../providers/patientDocumentsConfig', () => ({
  usePatientDocumentsConfig: () => ({
    patientDocumentsConfig: undefined,
    isLoading: false,
    error: null,
  }),
}));

// DocumentsSection has its own suite; stub it here so this suite can focus on the page-level
// wiring (action bar visibility, provider props) without also exercising the accordion internals.
jest.mock('../../components/DocumentsSection', () => ({
  DocumentsSection: () => <div data-testid="documents-section-mock" />,
}));

const mockUseVisitDocuments = jest.fn();
// Index reads this hook directly (AC 13: hide the action bar with no visits), sharing the same
// module DocumentsSection uses. Mocked so tests can drive visitGroups without a real fetch.
jest.mock('../../hooks/useVisitDocuments', () => ({
  ...jest.requireActual('../../hooks/useVisitDocuments'),
  useVisitDocuments: () => mockUseVisitDocuments(),
}));

const renderPage = (initialEntry = '/patient-uuid') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <IndexPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('IndexPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: one visit, so existing tests keep seeing the action bar as before AC 13 gated it.
    mockUseVisitDocuments.mockReturnValue({
      visitGroups: [{ visit: { id: 'visit-1' }, documents: [] }],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders the patient banner', () => {
    renderPage();
    expect(screen.getByTestId('patient-details-mock')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderPage();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('builds breadcrumb search URL with encoded encounter and concept params', async () => {
    renderPage(
      '/patient-uuid?encounterType=Patient%20Document&topLevelConcept=Patient%20Document&defaultOption=Patient%20File',
    );

    await expect(
      screen.findByTestId('header-mock'),
    ).resolves.toBeInTheDocument();

    const headerProps = mockHeaderProps.mock.calls[0][0];
    const searchBreadcrumb = headerProps.breadcrumbItems?.find(
      (item: any) => item.id === 'search',
    );
    expect(searchBreadcrumb?.href).toContain(
      'encounterType=Patient%20Document',
    );
    expect(searchBreadcrumb?.href).toContain(
      'topLevelConcept=Patient%20Document',
    );
    expect(searchBreadcrumb?.href).toContain('defaultOption=Patient%20File');
  });

  describe('page-level save', () => {
    it('renders the save action in the bottom action bar next to back-to-search', () => {
      renderPage();

      const actionBar = screen.getByTestId('back-to-search').parentElement;
      expect(actionBar).not.toBeNull();
      expect(actionBar).toContainElement(screen.getByTestId('save-documents'));
    });

    it('wraps the page in the pending-documents provider so queued files span visits', () => {
      renderPage();

      const provider = screen.getByTestId('pending-documents-provider');
      expect(provider).toContainElement(screen.getByTestId('save-documents'));
      expect(provider).toContainElement(
        screen.getByTestId('patient-details-mock'),
      );
      expect(mockProviderProps).toHaveBeenCalledWith(
        expect.objectContaining({ patientUuid: 'patient-uuid' }),
      );
    });

    it('notifies when document types fail to load, without blocking upload', async () => {
      const { getDocumentTypes } = jest.requireMock('@bahmni/services');
      getDocumentTypes.mockRejectedValueOnce(new Error('types boom'));

      renderPage('/patient-uuid?topLevelConcept=Patient%20Document');

      await waitFor(() =>
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error' }),
        ),
      );
    });
  });

  describe('action bar visibility (AC 13)', () => {
    it('hides the action bar when the patient has no visits', () => {
      mockUseVisitDocuments.mockReturnValue({
        visitGroups: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderPage();

      expect(screen.queryByTestId('back-to-search')).not.toBeInTheDocument();
      expect(screen.queryByTestId('save-documents')).not.toBeInTheDocument();
    });

    it('shows the action bar when the patient has at least one visit', () => {
      renderPage();

      expect(screen.getByTestId('back-to-search')).toBeInTheDocument();
      expect(screen.getByTestId('save-documents')).toBeInTheDocument();
    });
  });

  describe('back to search patient', () => {
    const search =
      '?encounterType=Patient%20Document&topLevelConcept=Patient%20Document';
    const originalLocation = window.location;

    // jsdom cannot navigate, so stand in a plain object and read back the assigned href.
    beforeEach(() => {
      delete (window as any).location;
      (window as any).location = { href: '' };
    });

    afterEach(() => {
      (window as any).location = originalLocation;
    });

    it('renders the action', () => {
      renderPage();
      expect(screen.getByTestId('back-to-search')).toBeInTheDocument();
    });

    it('navigates to the same search URL as the breadcrumb', async () => {
      renderPage(`/patient-uuid${search}`);
      await screen.findByTestId('header-mock');

      const headerProps = mockHeaderProps.mock.calls[0][0];
      const searchBreadcrumb = headerProps.breadcrumbItems?.find(
        (item: any) => item.id === 'search',
      );

      fireEvent.click(screen.getByTestId('back-to-search'));

      expect(window.location.href).toBe(searchBreadcrumb?.href);
    });
  });
});
