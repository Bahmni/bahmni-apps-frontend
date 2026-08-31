import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { Ref } from 'react';
import { DocumentsSection } from '../DocumentsSection';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getDocumentTypes: jest
    .fn()
    .mockResolvedValue([{ id: 'type-1', label: 'Prescription' }]),
}));

const mockAddNotification = jest.fn();
const mockSave = jest.fn().mockResolvedValue({ savedCount: 1, failures: [] });

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: () => ({ addNotification: mockAddNotification }),
  DocumentUpload: ({
    saveTarget,
    onPendingChange,
    ref,
  }: {
    saveTarget: unknown;
    onPendingChange: (hasPendingDocument: boolean) => void;
    ref: Ref<{ save: () => Promise<unknown> }>;
  }) => {
    const { useImperativeHandle } = jest.requireActual('react');
    useImperativeHandle(ref, () => ({ save: mockSave }));
    return (
      <div
        data-testid="document-upload"
        data-savetarget={JSON.stringify(saveTarget)}
      >
        <button
          data-testid="select-file"
          onClick={() => onPendingChange(true)}
        />
        <button
          data-testid="discard-file"
          onClick={() => onPendingChange(false)}
        />
      </div>
    );
  },
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
    documentEncounter: {
      resourceType: 'Encounter',
      id: 'doc-enc-1',
      status: 'finished',
      subject: { reference: 'Patient/patient-uuid' },
      partOf: { reference: 'Encounter/visit-1' },
    },
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

const SEARCH_HREF =
  '/bahmni/document-upload/?encounterType=Patient%20Document#/search';

const renderSection = (topLevelConcept?: string | null) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentsSection
        patientUuid="patient-uuid"
        documentEncounterType={documentEncounterType}
        topLevelConcept={topLevelConcept}
        searchHref={SEARCH_HREF}
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

  it('notifies when document types fail to load, without blocking upload', async () => {
    const { getDocumentTypes } = jest.requireMock('@bahmni/services');
    getDocumentTypes.mockRejectedValueOnce(new Error('types boom'));

    renderSection('Patient Document');

    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      ),
    );
    // Document type is optional, so upload widgets still render.
    expect(screen.getAllByTestId('document-upload').length).toBeGreaterThan(0);
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

  it('reuses an existing encounter as the save target when one exists, otherwise creates one', () => {
    renderSection();

    const targets = screen
      .getAllByTestId('document-upload')
      .map((node) => JSON.parse(node.getAttribute('data-savetarget') ?? '{}'));

    // The encounter travels whole, not just its uuid: the save bundle re-sends it as a PUT.
    expect(targets[0]).toEqual({
      encounterUuid: 'doc-enc-1',
      existingEncounter: {
        resourceType: 'Encounter',
        id: 'doc-enc-1',
        status: 'finished',
        subject: { reference: 'Patient/patient-uuid' },
        partOf: { reference: 'Encounter/visit-1' },
      },
    });
    expect(targets[1]).toEqual({
      createEncounterInVisit: {
        visitUuid: 'visit-2',
        encounterTypeUuid: 'doc-enc-type-uuid',
        encounterTypeDisplay: 'Patient Document',
        visitPeriod: { start: '2026-06-20T09:00:00Z' },
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

  it('renders the footer with back to search on one end and save on the other', () => {
    renderSection();

    const backToSearch = screen.getByTestId('back-to-search');
    expect(backToSearch).toHaveTextContent('Back to search patient');
    expect(backToSearch).toHaveAttribute('href', SEARCH_HREF);
    expect(screen.getByTestId('save-documents')).toHaveTextContent('Save');
  });

  it('keeps save disabled until a visit has a document waiting to be saved', () => {
    renderSection();

    expect(screen.getByTestId('save-documents')).toBeDisabled();

    fireEvent.click(screen.getAllByTestId('select-file')[0]);

    expect(screen.getByTestId('save-documents')).toBeEnabled();
  });

  it('shows a loading indicator in place of save while the save is in flight', async () => {
    let finishSave: (summary: unknown) => void = () => {};
    mockSave.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
    renderSection();
    fireEvent.click(screen.getAllByTestId('select-file')[0]);

    fireEvent.click(screen.getByTestId('save-documents'));

    expect(
      await screen.findByTestId('save-documents-loading'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('save-documents')).not.toBeInTheDocument();

    await act(async () => finishSave({ savedCount: 1, failures: [] }));

    expect(screen.getByTestId('save-documents')).toBeInTheDocument();
  });

  it('saves every visit holding a pending document when the footer save is clicked', async () => {
    renderSection();

    fireEvent.click(screen.getAllByTestId('select-file')[0]);
    fireEvent.click(screen.getAllByTestId('select-file')[2]);
    fireEvent.click(screen.getByTestId('save-documents'));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
  });

  it('refreshes the list once for the whole save, not once per visit', async () => {
    renderSection();
    fireEvent.click(screen.getAllByTestId('select-file')[0]);
    fireEvent.click(screen.getAllByTestId('select-file')[2]);

    fireEvent.click(screen.getByTestId('save-documents'));

    await waitFor(() => expect(mockRefetch).toHaveBeenCalledTimes(1));
    expect(mockSave).toHaveBeenCalledTimes(2);
  });

  it('keeps save unavailable until the refresh that updates the save target has landed', async () => {
    let finishRefresh: () => void = () => {};
    mockRefetch.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishRefresh = () => resolve();
        }),
    );
    renderSection();
    fireEvent.click(screen.getAllByTestId('select-file')[0]);

    fireEvent.click(screen.getByTestId('save-documents'));

    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    expect(screen.getByTestId('save-documents-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('save-documents')).not.toBeInTheDocument();

    await act(async () => finishRefresh());

    expect(screen.getByTestId('save-documents')).toBeInTheDocument();
  });

  it('keeps save enabled after discarding one of two pending visits', () => {
    renderSection();
    fireEvent.click(screen.getAllByTestId('select-file')[0]);
    fireEvent.click(screen.getAllByTestId('select-file')[1]);

    fireEvent.click(screen.getAllByTestId('discard-file')[0]);

    expect(screen.getByTestId('save-documents')).toBeEnabled();
  });

  it('does not save visits with nothing pending', async () => {
    renderSection();

    fireEvent.click(screen.getAllByTestId('select-file')[1]);
    fireEvent.click(screen.getByTestId('save-documents'));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
  });

  describe('save notification', () => {
    const saveAll = async (...summaries: unknown[]) => {
      summaries.forEach((summary) => mockSave.mockResolvedValueOnce(summary));
      renderSection();
      summaries.forEach((_, index) =>
        fireEvent.click(screen.getAllByTestId('select-file')[index]),
      );
      fireEvent.click(screen.getByTestId('save-documents'));
      await waitFor(() =>
        expect(mockSave).toHaveBeenCalledTimes(summaries.length),
      );
      await waitFor(() => expect(mockAddNotification).toHaveBeenCalled());
      return mockAddNotification.mock.calls;
    };

    it('raises a single notification for one saved document', async () => {
      const calls = await saveAll({ savedCount: 1, failures: [] });

      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual({
        title: 'Document saved',
        message: 'The document was saved successfully.',
        type: 'success',
      });
    });

    it('aggregates documents saved across visits into one notification', async () => {
      const calls = await saveAll(
        { savedCount: 2, failures: [] },
        { savedCount: 1, failures: [] },
      );

      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual({
        title: 'Document saved',
        message: '3 documents were saved successfully.',
        type: 'success',
      });
    });

    it('reports a partial save once, counting both halves', async () => {
      const calls = await saveAll(
        { savedCount: 2, failures: [] },
        {
          savedCount: 0,
          failures: [{ fileName: 'scan.png', message: 'Save rejected' }],
        },
      );

      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual({
        title: 'Some documents not saved',
        message:
          '2 of 3 documents saved; 1 failed. The failed documents are still listed so you can try again.',
        type: 'warning',
      });
    });

    it('counts the failures in one notification when nothing was saved', async () => {
      const calls = await saveAll(
        {
          savedCount: 0,
          failures: [{ fileName: 'scan.png', message: 'Save rejected' }],
        },
        {
          savedCount: 0,
          failures: [{ fileName: 'report.pdf', message: 'Save rejected' }],
        },
      );

      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual({
        title: 'Save failed',
        message:
          '2 files could not be saved. They are still listed so you can try again.',
        type: 'error',
      });
    });

    it('shows the server reason verbatim when a single document failed', async () => {
      const calls = await saveAll({
        savedCount: 0,
        failures: [{ fileName: 'scan.png', message: 'File too large' }],
      });

      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual({
        title: 'Save failed',
        message: 'File too large',
        type: 'error',
      });
    });

    it('stays quiet when a save neither saved nor failed anything', async () => {
      mockSave.mockResolvedValueOnce({ savedCount: 0, failures: [] });
      renderSection();

      fireEvent.click(screen.getAllByTestId('select-file')[0]);
      fireEvent.click(screen.getByTestId('save-documents'));

      await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
      expect(mockAddNotification).not.toHaveBeenCalled();
    });
  });

  it('passes the patient and document encounter type to the visit-documents hook', () => {
    renderSection();

    expect(mockUseVisitDocuments).toHaveBeenCalledWith('patient-uuid', [
      'doc-enc-type-uuid',
    ]);
  });

  describe('leaving with unsaved documents', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...originalLocation, href: 'current-page' },
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    const clickBackToSearch = () =>
      fireEvent.click(screen.getByTestId('back-to-search'));

    // Carbon keeps the modal mounted and marks it visible with a class, so presence proves nothing.
    const isModalShown = () =>
      screen
        .getByTestId('unsaved-documents-modal')
        .classList.contains('is-visible');

    it('follows the back link straight away when nothing is unsaved', () => {
      renderSection();

      expect(clickBackToSearch()).toBe(true);
      expect(isModalShown()).toBe(false);
    });

    it('holds the navigation and asks first when documents are unsaved', () => {
      renderSection();
      fireEvent.click(screen.getAllByTestId('select-file')[0]);

      expect(clickBackToSearch()).toBe(false);

      expect(isModalShown()).toBe(true);
      expect(screen.getByText('Unsaved documents')).toBeInTheDocument();
      expect(
        screen.getByText(
          'You have documents that have not been saved. Leaving this page now will lose them.',
        ),
      ).toBeInTheDocument();
      expect(window.location.href).toBe('current-page');
    });

    it('stays on the page when the user chooses to stay', () => {
      renderSection();
      fireEvent.click(screen.getAllByTestId('select-file')[0]);
      clickBackToSearch();

      fireEvent.click(screen.getByText('Stay'));

      expect(isModalShown()).toBe(false);
      expect(window.location.href).toBe('current-page');
    });

    it('navigates to the search page when the user chooses to leave', () => {
      renderSection();
      fireEvent.click(screen.getAllByTestId('select-file')[0]);
      clickBackToSearch();

      fireEvent.click(screen.getByText('Leave'));

      expect(window.location.href).toBe(SEARCH_HREF);
    });

    it('does not ask a second time once the user has confirmed leaving', () => {
      renderSection();
      fireEvent.click(screen.getAllByTestId('select-file')[0]);
      clickBackToSearch();

      fireEvent.click(screen.getByText('Leave'));

      const unload = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(unload);
      expect(unload.defaultPrevented).toBe(false);
    });

    it('warns through the browser on any other exit only while documents are unsaved', () => {
      const addEventListener = jest.spyOn(window, 'addEventListener');
      const removeEventListener = jest.spyOn(window, 'removeEventListener');
      renderSection();

      expect(addEventListener).not.toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function),
      );

      fireEvent.click(screen.getAllByTestId('select-file')[0]);
      const [, confirmUnload] =
        addEventListener.mock.calls.find(([type]) => type === 'beforeunload') ??
        [];
      expect(confirmUnload).toBeDefined();

      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);

      fireEvent.click(screen.getAllByTestId('discard-file')[0]);
      expect(removeEventListener).toHaveBeenCalledWith(
        'beforeunload',
        confirmUnload,
      );

      addEventListener.mockRestore();
      removeEventListener.mockRestore();
    });
  });
});
