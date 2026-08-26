/**
 * Covers the seam neither unit suite reaches.
 *
 * DocumentsSection.test.tsx stubs useVisitDocuments with a static value that never re-keys, and
 * useVisitDocuments.test.tsx never renders a component. Between them nothing verified what broke:
 * a save that creates a document encounter re-keys the documents query, and if the hook reports
 * isLoading again the section swaps the accordion for a skeleton, unmounting every upload widget
 * and discarding the pending documents of any visit whose save had just failed.
 *
 * The hook and the section are real here; only the services and the upload widget are stubbed. The
 * stub owns local state and counts its mounts, so a remount — the thing that destroyed pending
 * documents — is directly observable. The widget's own behaviour is covered by
 * DocumentUpload.test.tsx; it cannot be driven from here because @bahmni/widgets bundles its copy
 * of @bahmni/services, so an app-level mock never reaches the widget's internal calls.
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
import type { Ref } from 'react';
import { DocumentsSection } from '../DocumentsSection';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientEncounters: jest.fn(),
  getFormattedDocumentReferences: jest.fn(),
  getDocumentTypes: jest.fn().mockResolvedValue([{ id: 't1', label: 'Rx' }]),
}));

const mockAddNotification = jest.fn();
const mountCounts: Record<string, number> = {};
const saveResults: Record<string, 'ok' | 'fail'> = {};

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: () => ({ addNotification: mockAddNotification }),
  DocumentUpload: ({
    saveTarget,
    onPendingChange,
    ref,
  }: {
    saveTarget: {
      encounterUuid?: string;
      createEncounterInVisit?: { visitUuid: string };
    };
    onPendingChange: (hasPending: boolean) => void;
    ref: Ref<{ save: () => Promise<unknown> }>;
  }) => {
    const { useImperativeHandle, useState, useEffect } =
      jest.requireActual('react');
    const key =
      saveTarget.encounterUuid ??
      saveTarget.createEncounterInVisit?.visitUuid ??
      'unknown';
    const [pending, setPending] = useState<string[]>([]);

    useEffect(() => {
      mountCounts[key] = (mountCounts[key] ?? 0) + 1;
    }, [key]);

    useImperativeHandle(ref, () => ({
      save: async () => {
        if (saveResults[key] === 'fail') {
          // Mirrors the real widget: a failed save keeps its rows for retry.
          return {
            savedCount: 0,
            failures: [{ fileName: 'f.png', message: 'Bundle rejected' }],
          };
        }
        setPending([]);
        onPendingChange(false);
        return { savedCount: pending.length, failures: [] };
      },
    }));

    return (
      <div data-testid="document-upload">
        <button
          data-testid={`select-${key}`}
          onClick={() => {
            setPending(['f.png']);
            onPendingChange(true);
          }}
        />
        {pending.map((name) => (
          <span key={name} data-testid={`pending-${key}`}>
            {name}
          </span>
        ))}
      </div>
    );
  },
}));

const { getPatientEncounters, getFormattedDocumentReferences } =
  jest.requireMock('@bahmni/services');

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
    Object.keys(mountCounts).forEach((k) => delete mountCounts[k]);
    Object.keys(saveResults).forEach((k) => delete saveResults[k]);
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
    saveResults['visit-2'] = 'fail';

    let releaseDocuments: (docs: unknown[]) => void = () => {};
    getFormattedDocumentReferences.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseDocuments = resolve as (docs: unknown[]) => void;
        }),
    );

    renderSection();

    await screen.findByTestId('select-visit-1');
    fireEvent.click(screen.getByTestId('select-visit-1'));
    fireEvent.click(screen.getByTestId('select-visit-2'));
    await waitFor(() =>
      expect(screen.getByTestId('pending-visit-2')).toBeInTheDocument(),
    );
    const mountsBeforeSave = mountCounts['visit-2'];

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
    expect(mountCounts['visit-2']).toBe(mountsBeforeSave);
    expect(screen.getByTestId('pending-visit-2')).toBeInTheDocument();

    releaseDocuments([]);
    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'warning' }),
      ),
    );
    expect(screen.getByTestId('pending-visit-2')).toBeInTheDocument();
  });
});
