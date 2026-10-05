/**
 * Covers the seam neither unit suite reaches.
 *
 * DocumentsSection.test.tsx stubs useVisitDocuments with a static value that never re-keys, and
 * useVisitDocuments.test.tsx never renders a component. Between them nothing verified what broke:
 * a save that creates a document encounter re-keys the documents query, and if the hook reports
 * isLoading again the section swaps the accordion for a skeleton, unmounting every upload widget
 * mid-save and leaving the visit whose save had just failed without its pending documents on screen.
 *
 * The hook, the section and its save service are real here; only the backend calls and the upload
 * widget are stubbed. The stub renders the documents the section hands it and tags itself with an
 * id unique to its mount, so a remount is directly observable.
 *
 * Two things this test needs in order to catch anything, both learned the hard way:
 *   1. No visit may start with a document encounter, or placeholderData serves previous data and
 *      isPending never flips — the test then passes with the fix removed.
 *   2. It must assert while the re-keyed query is in flight; an instantly-resolving mock closes
 *      that window before React re-renders.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Encounter } from 'fhir/r4';
import { DocumentsSection } from '../DocumentsSection';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientEncounters: jest.fn(),
  getFormattedDocumentReferences: jest.fn(),
  getDocumentTypes: jest.fn().mockResolvedValue([{ id: 't1', label: 'Rx' }]),
  uploadDocument: jest.fn(),
  saveDocuments: jest.fn(),
  dispatchAuditEvent: jest.fn(),
}));

global.URL.revokeObjectURL = jest.fn();

const mockAddNotification = jest.fn();

interface StubDocument {
  id: string;
  fileName: string;
  url: string;
  note: string;
}

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: () => ({ addNotification: mockAddNotification }),
  useActivePractitioner: () => ({ practitioner: { uuid: 'practitioner' } }),
  DocumentUpload: ({
    documents,
    onDocumentsChange,
  }: {
    documents: StubDocument[];
    onDocumentsChange: (documents: StubDocument[]) => void;
  }) => {
    const { useId } = jest.requireActual('react');
    // A fresh id per mount, so a remounted widget carries a different one.
    const instance = useId();

    return (
      <div data-testid="document-upload" data-instance={instance}>
        <button
          data-testid="select-file"
          onClick={() =>
            onDocumentsChange([
              ...documents,
              {
                id: `${instance}f.png`,
                fileName: 'f.png',
                url: 'blob:f',
                note: '',
              },
            ])
          }
        />
        {documents.map((document) => (
          <span key={document.id} data-testid="pending">
            {document.fileName}
          </span>
        ))}
      </div>
    );
  },
}));

const {
  getPatientEncounters,
  getFormattedDocumentReferences,
  uploadDocument,
  saveDocuments,
} = jest.requireMock('@bahmni/services');

const DOC_TYPE_UUID = 'doc-enc-type-uuid';
const PATIENT = 'patient-uuid';

const visit = (id: string, start: string): Encounter => ({
  resourceType: 'Encounter',
  id,
  status: 'finished',
  meta: { tag: [{ code: 'visit' }] },
  subject: { reference: `Patient/${PATIENT}` },
  period: { start },
});

const docEncounter = (id: string, visitId: string): Encounter => ({
  resourceType: 'Encounter',
  id,
  status: 'finished',
  meta: { tag: [{ code: 'encounter' }] },
  subject: { reference: `Patient/${PATIENT}` },
  partOf: { reference: `Encounter/${visitId}` },
  type: [{ coding: [{ code: DOC_TYPE_UUID }] }],
});

const renderSection = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <DocumentsSection
        patientUuid={PATIENT}
        documentEncounterType={{
          uuid: DOC_TYPE_UUID,
          name: 'Patient Document',
        }}
        topLevelConcept="Document Type"
      />
    </QueryClientProvider>,
  );

describe('DocumentsSection integration with the real useVisitDocuments hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadDocument.mockResolvedValue({ url: 'patient/f.png' });
  });

  it('keeps a failed visit’s pending document when another visit’s save re-keys the documents query', async () => {
    getPatientEncounters
      .mockResolvedValueOnce([
        visit('visit-1', '2026-06-29T09:00:00Z'),
        visit('visit-2', '2026-06-20T09:00:00Z'),
      ])
      // visit-1's save created this patient's first document encounter, so the documents query
      // goes from disabled-with-no-data to enabled under a new key.
      .mockResolvedValue([
        visit('visit-1', '2026-06-29T09:00:00Z'),
        visit('visit-2', '2026-06-20T09:00:00Z'),
        docEncounter('doc-enc-1', 'visit-1'),
      ]);
    saveDocuments.mockImplementation(
      async ({
        target,
      }: {
        target: { createEncounterInVisit?: { visitUuid: string } };
      }) => {
        if (target.createEncounterInVisit?.visitUuid === 'visit-2') {
          throw new Error('Bundle rejected');
        }
        return {};
      },
    );

    let releaseDocuments: (docs: unknown[]) => void = () => {};
    getFormattedDocumentReferences.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseDocuments = resolve as (docs: unknown[]) => void;
        }),
    );

    renderSection();

    const [visit1Widget, visit2Widget] =
      await screen.findAllByTestId('document-upload');
    const visit2Instance = visit2Widget.getAttribute('data-instance')!;
    fireEvent.click(visit1Widget.querySelector('button')!);
    fireEvent.click(visit2Widget.querySelector('button')!);
    await waitFor(() =>
      expect(screen.getAllByTestId('pending')).toHaveLength(2),
    );

    await waitFor(() =>
      expect(screen.getByTestId('save-documents')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTestId('save-documents'));

    await waitFor(() =>
      expect(getFormattedDocumentReferences).toHaveBeenCalled(),
    );

    // While the re-keyed query loads, the section must not fall back to its skeleton...
    expect(
      screen.queryByTestId('document-section-skeleton'),
    ).not.toBeInTheDocument();
    // ...so the failed visit's widget is never remounted and keeps its pending document.
    expect(screen.getAllByTestId('document-upload')[1]).toHaveAttribute(
      'data-instance',
      visit2Instance,
    );
    await waitFor(() =>
      expect(screen.getAllByTestId('pending')).toHaveLength(1),
    );

    releaseDocuments([]);
    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'warning' }),
      ),
    );
    const [, failedVisitWidget] = screen.getAllByTestId('document-upload');
    expect(failedVisitWidget).toHaveTextContent('f.png');
    expect(screen.getAllByTestId('pending')).toHaveLength(1);
  });
});
