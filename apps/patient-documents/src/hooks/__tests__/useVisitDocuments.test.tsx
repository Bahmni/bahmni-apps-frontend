import {
  DocumentViewModel,
  getFormattedDocumentReferences,
  getPatientEncounters,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Encounter } from 'fhir/r4';
import React from 'react';
import { useVisitDocuments } from '../useVisitDocuments';

jest.mock('@bahmni/services', () => ({
  getPatientEncounters: jest.fn(),
  getFormattedDocumentReferences: jest.fn(),
}));

const mockedGetPatientEncounters = getPatientEncounters as jest.MockedFunction<
  typeof getPatientEncounters
>;
const mockedGetFormattedDocumentReferences =
  getFormattedDocumentReferences as jest.MockedFunction<
    typeof getFormattedDocumentReferences
  >;

const PATIENT_UUID = 'a3f1e6c2-8b4d-4e7a-9c1f-2d5b6a7c8e90';
const DOC_ENCOUNTER_TYPE_UUID = 'b6f8b3e1-4c2a-4b7e-9c1d-8a2f5e6d7c90';

const OLDER_VISIT_UUID = '11111111-1111-4111-8111-111111111111';
const NEWER_VISIT_UUID = '22222222-2222-4222-8222-222222222222';
const OLDER_DOC_ENCOUNTER_UUID = '33333333-3333-4333-8333-333333333333';
const NEWER_DOC_ENCOUNTER_UUID = '44444444-4444-4444-8444-444444444444';
const CONSULTATION_ENCOUNTER_UUID = '55555555-5555-4555-8555-555555555555';

const visit = (id: string, start: string, end?: string): Encounter => ({
  resourceType: 'Encounter',
  id,
  status: 'finished',
  meta: { tag: [{ code: 'visit', display: 'Visit' }] },
  class: { code: 'AMB' },
  subject: { reference: `Patient/${PATIENT_UUID}` },
  period: { start, ...(end ? { end } : {}) },
});

const childEncounter = (
  id: string,
  visitUuid: string,
  typeCode: string,
): Encounter => ({
  resourceType: 'Encounter',
  id,
  status: 'finished',
  meta: { tag: [{ code: 'encounter', display: 'Encounter' }] },
  class: { code: 'AMB' },
  subject: { reference: `Patient/${PATIENT_UUID}` },
  partOf: { reference: `Encounter/${visitUuid}` },
  type: [{ coding: [{ code: typeCode }] }],
});

const document = (id: string, encounterId: string): DocumentViewModel => ({
  id,
  documentIdentifier: id,
  uploadedOn: '2026-06-29T09:20:00+00:00',
  documentUrl: `100/${id}__scan.pdf`,
  contentType: 'application/pdf',
  attachments: [{ url: `100/${id}__scan.pdf`, contentType: 'application/pdf' }],
  encounterId,
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useVisitDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('groups documents under their visit via partOf, sorted latest visit first, and resolves the reusable document encounter', async () => {
    mockedGetPatientEncounters.mockResolvedValue([
      // deliberately out of order to prove the hook sorts
      visit(
        OLDER_VISIT_UUID,
        '2026-06-20T08:00:00+00:00',
        '2026-06-20T10:00:00+00:00',
      ),
      visit(NEWER_VISIT_UUID, '2026-06-29T09:15:00+00:00'),
      childEncounter(
        NEWER_DOC_ENCOUNTER_UUID,
        NEWER_VISIT_UUID,
        DOC_ENCOUNTER_TYPE_UUID,
      ),
      childEncounter(
        OLDER_DOC_ENCOUNTER_UUID,
        OLDER_VISIT_UUID,
        DOC_ENCOUNTER_TYPE_UUID,
      ),
      // a non-document child encounter must not be picked as the document encounter
      childEncounter(
        CONSULTATION_ENCOUNTER_UUID,
        NEWER_VISIT_UUID,
        'some-other-type-uuid',
      ),
    ]);
    mockedGetFormattedDocumentReferences.mockResolvedValue([
      document('doc-newer', NEWER_DOC_ENCOUNTER_UUID),
      document('doc-older', OLDER_DOC_ENCOUNTER_UUID),
    ]);

    const { result } = renderHook(
      () => useVisitDocuments(PATIENT_UUID, DOC_ENCOUNTER_TYPE_UUID),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const groups = result.current.visitGroups;
    expect(groups).toHaveLength(2);

    // latest visit first
    expect(groups[0].visit.id).toBe(NEWER_VISIT_UUID);
    expect(groups[1].visit.id).toBe(OLDER_VISIT_UUID);

    // documents grouped under the correct visit through their child encounter
    expect(groups[0].documents.map((d) => d.id)).toEqual(['doc-newer']);
    expect(groups[1].documents.map((d) => d.id)).toEqual(['doc-older']);

    // reusable document encounter resolved per visit (not the consultation encounter)
    expect(groups[0].documentEncounterUuid).toBe(NEWER_DOC_ENCOUNTER_UUID);
    expect(groups[1].documentEncounterUuid).toBe(OLDER_DOC_ENCOUNTER_UUID);
  });

  it('leaves documentEncounterUuid undefined and documents empty for a visit with no document encounter', async () => {
    mockedGetPatientEncounters.mockResolvedValue([
      visit(NEWER_VISIT_UUID, '2026-06-29T09:15:00+00:00'),
    ]);
    mockedGetFormattedDocumentReferences.mockResolvedValue([]);

    const { result } = renderHook(
      () => useVisitDocuments(PATIENT_UUID, DOC_ENCOUNTER_TYPE_UUID),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.visitGroups).toHaveLength(1);
    expect(result.current.visitGroups[0].documents).toEqual([]);
    expect(result.current.visitGroups[0].documentEncounterUuid).toBeUndefined();
  });

  it('ignores documents without an encounter and malformed child encounters, and refetches both queries', async () => {
    mockedGetPatientEncounters.mockResolvedValue([
      visit(NEWER_VISIT_UUID, '2026-06-29T09:15:00+00:00'),
      // malformed child encounter: has a parent visit but no id -> must be skipped
      {
        resourceType: 'Encounter',
        status: 'finished',
        meta: { tag: [{ code: 'encounter' }] },
        partOf: { reference: `Encounter/${NEWER_VISIT_UUID}` },
        type: [{ coding: [{ code: DOC_ENCOUNTER_TYPE_UUID }] }],
      } as Encounter,
    ]);
    mockedGetFormattedDocumentReferences.mockResolvedValue([
      // document without an encounterId -> must be skipped, not thrown on
      { ...document('doc-orphan', ''), encounterId: undefined },
    ]);

    const { result } = renderHook(
      () => useVisitDocuments(PATIENT_UUID, DOC_ENCOUNTER_TYPE_UUID),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.visitGroups).toHaveLength(1);
    expect(result.current.visitGroups[0].documents).toEqual([]);
    expect(result.current.visitGroups[0].documentEncounterUuid).toBeUndefined();

    result.current.refetch();

    await waitFor(() =>
      expect(mockedGetPatientEncounters).toHaveBeenCalledTimes(2),
    );
    expect(mockedGetFormattedDocumentReferences).toHaveBeenCalledTimes(2);
  });

  it('groups a document attached directly to a visit-level encounter', async () => {
    mockedGetPatientEncounters.mockResolvedValue([
      visit(NEWER_VISIT_UUID, '2026-06-29T09:15:00+00:00'),
    ]);
    // document's encounterId is the visit itself (no child encounter in between)
    mockedGetFormattedDocumentReferences.mockResolvedValue([
      document('doc-on-visit', NEWER_VISIT_UUID),
    ]);

    const { result } = renderHook(
      () => useVisitDocuments(PATIENT_UUID, DOC_ENCOUNTER_TYPE_UUID),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.visitGroups).toHaveLength(1);
    expect(result.current.visitGroups[0].documents.map((d) => d.id)).toEqual([
      'doc-on-visit',
    ]);
  });

  it('does not fetch and returns no groups when patientUuid is null', () => {
    const { result } = renderHook(
      () => useVisitDocuments(null, DOC_ENCOUNTER_TYPE_UUID),
      { wrapper },
    );

    expect(result.current.visitGroups).toEqual([]);
    expect(mockedGetPatientEncounters).not.toHaveBeenCalled();
    expect(mockedGetFormattedDocumentReferences).not.toHaveBeenCalled();
  });
});
