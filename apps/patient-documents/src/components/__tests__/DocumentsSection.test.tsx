import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { DocumentsSection } from '../DocumentsSection';

// DocumentUpload has its own test suite; stub it here and expose the wiring we care about.
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  DocumentUpload: (props: { sourceId: string; saveTarget: unknown }) => (
    <div
      data-testid="document-upload"
      data-sourceid={props.sourceId}
      data-savetarget={JSON.stringify(props.saveTarget)}
    />
  ),
}));

const mockUseVisitDocuments = jest.fn();
const mockRefetch = jest.fn();
jest.mock('../../hooks/useVisitDocuments', () => ({
  useVisitDocuments: (...args: unknown[]) => mockUseVisitDocuments(...args),
}));

const documentEncounterType = {
  uuid: 'doc-enc-type-uuid',
  name: 'Patient Document',
};

const imageDoc = {
  id: 'doc-image',
  documentIdentifier: 'Rx-image',
  documentType: 'Prescription',
  uploadedOn: '2026-06-29T09:20:00Z',
  documentUrl: '100/doc-image.png',
  contentType: 'image/png',
  attachments: [],
  description: 'take twice daily',
  encounterId: 'doc-enc-1',
};
const videoDoc = {
  id: 'doc-video',
  documentIdentifier: 'Scan-video',
  documentType: 'Report',
  uploadedOn: '2026-06-29T09:21:00Z',
  documentUrl: '100/doc-video.mp4',
  contentType: 'video/mp4',
  attachments: [],
  encounterId: 'doc-enc-1',
};
const pdfDoc = {
  id: 'doc-pdf',
  documentIdentifier: 'Note-pdf',
  uploadedOn: '2026-06-29T09:22:00Z',
  documentUrl: '100/doc-pdf.pdf',
  contentType: 'application/pdf',
  attachments: [],
  encounterId: 'doc-enc-1',
};

const visitGroups = [
  {
    visit: {
      resourceType: 'Encounter',
      id: 'visit-1',
      period: { start: '2026-06-29T09:00:00Z', end: '2026-06-29T12:00:00Z' },
    },
    documents: [imageDoc, videoDoc, pdfDoc],
    documentEncounterUuid: 'doc-enc-1',
  },
  {
    visit: {
      resourceType: 'Encounter',
      id: 'visit-2',
      period: { start: '2026-06-20T09:00:00Z' },
    },
    documents: [],
  },
  {
    visit: { resourceType: 'Encounter', id: 'visit-3' },
    documents: [],
  },
];

const renderSection = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentsSection
        patientUuid="patient-uuid"
        documentEncounterType={documentEncounterType}
      />
    </QueryClientProvider>,
  );
};

describe('DocumentsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVisitDocuments.mockReturnValue({
      visitGroups,
      isLoading: false,
      refetch: mockRefetch,
    });
  });

  it('shows the loading state and no content while loading', () => {
    mockUseVisitDocuments.mockReturnValue({
      visitGroups: [],
      isLoading: true,
      refetch: mockRefetch,
    });

    const { container } = renderSection();

    expect(screen.getByTestId('document-section-skeleton')).toBeInTheDocument();
    expect(screen.queryAllByTestId('document-upload')).toHaveLength(0);
    expect(container.querySelectorAll('.cds--accordion__heading')).toHaveLength(
      0,
    );
  });

  it('surfaces a load error instead of silently rendering nothing', () => {
    mockUseVisitDocuments.mockReturnValue({
      visitGroups: [],
      isLoading: false,
      error: new Error('Failed to load documents'),
      refetch: mockRefetch,
    });

    renderSection();

    expect(screen.getByText('Failed to load documents')).toBeInTheDocument();
    expect(screen.queryAllByTestId('document-upload')).toHaveLength(0);
  });

  it('renders nothing when the patient has no visits', () => {
    mockUseVisitDocuments.mockReturnValue({
      visitGroups: [],
      isLoading: false,
      refetch: mockRefetch,
    });

    const { container } = renderSection();

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryAllByTestId('document-upload')).toHaveLength(0);
  });

  it('renders an accordion and an upload widget per visit', () => {
    const { container } = renderSection();

    expect(container.querySelector('.cds--accordion')).toBeInTheDocument();
    expect(screen.getAllByTestId('document-upload')).toHaveLength(3);
  });

  it('renders saved documents with their type and note', () => {
    renderSection();

    expect(screen.getByText('Prescription')).toBeInTheDocument();
    expect(screen.getByText('Report')).toBeInTheDocument();
    expect(screen.getByDisplayValue('take twice daily')).toBeInTheDocument();
  });

  it('tags each upload widget with its own visit, so queued files stay under that visit', () => {
    renderSection();

    const sources = screen
      .getAllByTestId('document-upload')
      .map((node) => node.getAttribute('data-sourceid'));

    expect(sources).toEqual(['visit-1', 'visit-2', 'visit-3']);
  });

  it('reuses an existing encounter as the save target when one exists, otherwise creates one', () => {
    renderSection();

    const targets = screen
      .getAllByTestId('document-upload')
      .map((node) => JSON.parse(node.getAttribute('data-savetarget') ?? '{}'));

    expect(targets[0]).toEqual({ encounterUuid: 'doc-enc-1' });
    expect(targets[1]).toEqual({
      createEncounterInVisit: {
        visitUuid: 'visit-2',
        encounterTypeUuid: 'doc-enc-type-uuid',
        encounterTypeDisplay: 'Patient Document',
      },
    });
  });

  it('opens only the latest (first) visit accordion by default', () => {
    const { container } = renderSection();

    const headings = container.querySelectorAll('.cds--accordion__heading');
    expect(headings).toHaveLength(3);
    expect(headings[0].getAttribute('aria-expanded')).toBe('true');
    expect(headings[1].getAttribute('aria-expanded')).toBe('false');
    expect(headings[2].getAttribute('aria-expanded')).toBe('false');
  });

  it('passes the patient and document encounter type to the visit-documents hook', () => {
    renderSection();

    expect(mockUseVisitDocuments).toHaveBeenCalledWith('patient-uuid', [
      'doc-enc-type-uuid',
    ]);
  });

  // One visit per case so a label assertion cannot match a sibling visit's heading. Matched on the
  // label prefix rather than a formatted date: formatDateTime resolves its pattern from the browser
  // locale, so asserting an exact date string would be locale-dependent.
  describe('visit labels', () => {
    const renderVisit = (period?: { start?: string; end?: string }) => {
      mockUseVisitDocuments.mockReturnValue({
        visitGroups: [
          {
            visit: {
              resourceType: 'Encounter',
              id: 'visit-under-test',
              period,
            },
            documents: [],
          },
        ],
        isLoading: false,
        refetch: mockRefetch,
      });
      renderSection();
    };

    it('reads "Visit on <date>" when the visit starts and ends on the same day', () => {
      renderVisit({
        start: '2026-06-29T09:00:00Z',
        end: '2026-06-29T12:00:00Z',
      });

      expect(screen.getByText(/^Visit on \S+$/)).toBeInTheDocument();
      expect(
        screen.queryByText(/^Visit from .+ to .+$/),
      ).not.toBeInTheDocument();
    });

    it('keeps the from/to range when the visit spans more than one day', () => {
      renderVisit({
        start: '2026-06-29T09:00:00Z',
        end: '2026-07-02T12:00:00Z',
      });

      expect(screen.getByText(/^Visit from .+ to .+$/)).toBeInTheDocument();
      expect(screen.queryByText(/^Visit on \S+$/)).not.toBeInTheDocument();
    });

    // An open visit has only a start, and visits here are single-day in practice, so it reads as
    // "Visit on <start>" rather than an open-ended "Visit from <start>".
    it('reads "Visit on <date>" for an open visit with no end date', () => {
      renderVisit({ start: '2026-06-20T09:00:00Z' });

      expect(screen.getByText(/^Visit on \S+$/)).toBeInTheDocument();
      expect(
        screen.queryByText(/^Visit from .+ to .+$/),
      ).not.toBeInTheDocument();
    });

    it('falls back to a bare "Visit" when the visit has no period at all', () => {
      renderVisit(undefined);

      expect(screen.getByText('Visit')).toBeInTheDocument();
      expect(screen.queryByText(/^Visit on \S+$/)).not.toBeInTheDocument();
    });
  });
});
