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

interface StubEntry {
  id: string;
  documentType: null;
  documentId: string;
  note: string;
  errors: Record<string, string>;
  files: StubDocument[];
}

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
    documents: StubEntry[];
    onDocumentsChange: (documents: StubEntry[]) => void;
  }) => {
    const { useId } = jest.requireActual('react');
    const instance = useId();
    const files = documents.flatMap((entry) => entry.files);

    return (
      <div data-testid="document-upload" data-instance={instance}>
        <button
          data-testid="select-file"
          onClick={() =>
            onDocumentsChange([
              {
                id: `${instance}doc`,
                documentType: null,
                documentId: '',
                note: '',
                errors: {},
                files: [
                  ...files,
                  {
                    id: `${instance}f.png`,
                    fileName: 'f.png',
                    url: 'blob:f',
                  },
                ],
              },
            ])
          }
        />
        {files.map((file) => (
          <span key={file.id} data-testid="pending">
            {file.fileName}
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
    expect(
      screen.queryByTestId('document-section-skeleton'),
    ).not.toBeInTheDocument();
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
