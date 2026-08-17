import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { DocumentUpload } from '../DocumentUpload';
import { PendingDocumentsProvider } from '../PendingDocumentsProvider';
import { SaveDocumentsButton } from '../SaveDocumentsButton';
import { usePendingDocuments } from '../usePendingDocuments';

const saveAll = async ({ documents }: { documents: unknown[] }) => ({
  savedIndices: documents.map((_, index) => index),
  failures: [],
});

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  uploadDocument: jest.fn(),
  saveDocuments: jest.fn(),
  getDocumentUploadMaxSizeMb: jest.fn().mockResolvedValue(5),
  dispatchAuditEvent: jest.fn(),
}));

global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test-blob');
global.URL.revokeObjectURL = jest.fn();

const mockAddNotification = jest.fn();
jest.mock('../../notification', () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

jest.mock('../../activePractitioner', () => ({
  useActivePractitioner: () => ({
    practitioner: { uuid: 'practitioner-uuid' },
  }),
}));

const { uploadDocument, saveDocuments, dispatchAuditEvent } =
  jest.requireMock('@bahmni/services');

// The first visit already has a document encounter; the second has none and needs one created.
const VISIT_1_TARGET = { encounterUuid: 'encounter-1' };
const VISIT_2_TARGET = {
  createEncounterInVisit: {
    visitUuid: 'visit-2',
    encounterTypeUuid: 'encounter-type-uuid',
    encounterTypeDisplay: 'Patient Document',
  },
};

const renderTwoVisits = (onSaved = jest.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PendingDocumentsProvider
        patientUuid="patient-uuid"
        encounterTypeName="Patient Document"
        documentTypes={[{ id: 'type-1', label: 'Lab Report' }]}
        onSaved={onSaved}
      >
        <div data-testid="visit-1">
          <DocumentUpload sourceId="visit-1" saveTarget={VISIT_1_TARGET} />
        </div>
        <div data-testid="visit-2">
          <DocumentUpload sourceId="visit-2" saveTarget={VISIT_2_TARGET} />
        </div>
        <SaveDocumentsButton />
      </PendingDocumentsProvider>
    </QueryClientProvider>,
  );
};

const makeFile = (name: string) =>
  new File([new Uint8Array(4)], name, { type: 'image/png' });

const selectInVisit = (visit: string, names: string[]) => {
  const input = within(screen.getByTestId(visit)).getByTestId(
    'document-file-input',
  );
  fireEvent.change(input, { target: { files: names.map(makeFile) } });
};

const rowsIn = (visit: string) =>
  within(screen.getByTestId(visit)).queryAllByTestId('pending-document-row');

const clickSave = () => fireEvent.click(screen.getByTestId('save-documents'));

describe('PendingDocumentsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveDocuments.mockImplementation(saveAll);
    uploadDocument.mockImplementation(async (file: File) => ({
      url: `server/${file.name}`,
    }));
  });

  it('shows each queued file only under the visit it was added to', async () => {
    renderTwoVisits();

    selectInVisit('visit-1', ['scan.png']);
    selectInVisit('visit-2', ['report.png', 'clip.png']);

    await waitFor(() => expect(rowsIn('visit-1')).toHaveLength(1));
    expect(rowsIn('visit-2')).toHaveLength(2);
    expect(
      within(screen.getByTestId('visit-1')).getByText('scan.png'),
    ).toBeInTheDocument();
  });

  it('saves files queued under different visits in one click', async () => {
    renderTwoVisits();
    selectInVisit('visit-1', ['scan.png']);
    selectInVisit('visit-2', ['report.png']);
    await waitFor(() => expect(rowsIn('visit-2')).toHaveLength(1));

    clickSave();

    await waitFor(() => expect(uploadDocument).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(rowsIn('visit-1')).toHaveLength(0));
    expect(rowsIn('visit-2')).toHaveLength(0);
  });

  it('sends one save call per visit, each with that visit target', async () => {
    renderTwoVisits();
    selectInVisit('visit-1', ['scan.png']);
    selectInVisit('visit-2', ['report.png']);
    await waitFor(() => expect(rowsIn('visit-2')).toHaveLength(1));

    clickSave();

    // Documents of different visits cannot share a call: each visit has its own encounter.
    await waitFor(() => expect(saveDocuments).toHaveBeenCalledTimes(2));
    expect(saveDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        encounterUuid: 'encounter-1',
        documents: [expect.objectContaining({ title: 'scan.png' })],
      }),
    );
    expect(saveDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        createEncounterInVisit: VISIT_2_TARGET.createEncounterInVisit,
        documents: [expect.objectContaining({ title: 'report.png' })],
      }),
    );
  });

  it('groups all of a visit files into that visit single save call', async () => {
    renderTwoVisits();
    selectInVisit('visit-2', ['a.png', 'b.png', 'c.png']);
    await waitFor(() => expect(rowsIn('visit-2')).toHaveLength(3));

    clickSave();

    // One encounter for the visit, not one per file.
    await waitFor(() => expect(saveDocuments).toHaveBeenCalledTimes(1));
    expect(saveDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        documents: [
          expect.objectContaining({ title: 'a.png' }),
          expect.objectContaining({ title: 'b.png' }),
          expect.objectContaining({ title: 'c.png' }),
        ],
      }),
    );
  });

  it('reports one success and one audit event per saved document', async () => {
    const onSaved = jest.fn();
    renderTwoVisits(onSaved);
    selectInVisit('visit-1', ['scan.png']);
    selectInVisit('visit-2', ['report.png']);
    await waitFor(() => expect(rowsIn('visit-2')).toHaveLength(1));

    clickSave();

    await waitFor(() => expect(dispatchAuditEvent).toHaveBeenCalledTimes(2));
    expect(onSaved).toHaveBeenCalledTimes(1);
    // Exactly one notification for an all-success save (AC 6/7 apply to every outcome, not just
    // the partial one).
    expect(mockAddNotification).toHaveBeenCalledTimes(1);
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        message: 'DOCUMENT_UPLOAD_SAVE_SUCCESS_MESSAGE_MULTIPLE',
      }),
    );
  });

  it('keeps one visit files when that visit save fails and clears the other, firing a single consolidated warning', async () => {
    saveDocuments.mockImplementation(
      async (input: { encounterUuid?: string; documents: unknown[] }) =>
        input.encounterUuid
          ? {
              savedIndices: [],
              failures: [{ index: 0, error: new Error('nope') }],
            }
          : saveAll(input),
    );
    const onSaved = jest.fn();
    renderTwoVisits(onSaved);
    selectInVisit('visit-1', ['scan.png']);
    selectInVisit('visit-2', ['report.png']);
    await waitFor(() => expect(rowsIn('visit-2')).toHaveLength(1));

    clickSave();

    await waitFor(() => expect(rowsIn('visit-2')).toHaveLength(0));
    // The failed row (visit-1) stays pending so it can be retried; the succeeded row is cleared.
    expect(rowsIn('visit-1')).toHaveLength(1);
    // The page must still refresh for what did save, even though the save was only partial.
    expect(onSaved).toHaveBeenCalledTimes(1);
    // AC 6: one saved and one failed produces exactly one warning, not a success plus an error.
    expect(mockAddNotification).toHaveBeenCalledTimes(1);
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        title: 'DOCUMENT_UPLOAD_SAVE_PARTIAL_TITLE',
        message: 'DOCUMENT_UPLOAD_SAVE_PARTIAL_MESSAGE',
      }),
    );
  });

  it('fires exactly one error notification naming the files when every document fails', async () => {
    uploadDocument.mockImplementation(async () => {
      throw new Error('boom');
    });
    const onSaved = jest.fn();
    renderTwoVisits(onSaved);
    selectInVisit('visit-1', ['scan.png', 'other.png']);
    await waitFor(() => expect(rowsIn('visit-1')).toHaveLength(2));

    clickSave();

    await waitFor(() => expect(mockAddNotification).toHaveBeenCalledTimes(1));
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'DOCUMENT_UPLOAD_SAVE_FAILED_TITLE',
        message: 'DOCUMENT_UPLOAD_SAVE_FAILED_MESSAGE_MULTIPLE',
      }),
    );
    // Nothing saved, so every row stays pending and Save can be retried.
    expect(rowsIn('visit-1')).toHaveLength(2);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('surfaces the server error message when a lone save fails entirely', async () => {
    uploadDocument.mockImplementation(async () => {
      throw new Error('server exploded');
    });
    renderTwoVisits();
    selectInVisit('visit-1', ['scan.png']);
    await waitFor(() => expect(rowsIn('visit-1')).toHaveLength(1));

    clickSave();

    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'server exploded',
        }),
      ),
    );
    expect(mockAddNotification).toHaveBeenCalledTimes(1);
  });

  it('disables the save action while nothing is queued', () => {
    renderTwoVisits();
    expect(screen.getByTestId('save-documents')).toBeDisabled();
  });

  it('does nothing when save is triggered with an empty queue', async () => {
    renderTwoVisits();

    clickSave();

    await waitFor(() => expect(uploadDocument).not.toHaveBeenCalled());
    expect(saveDocuments).not.toHaveBeenCalled();
  });

  it('throws when the hook is used outside the provider', () => {
    const Orphan = () => {
      usePendingDocuments();
      return null;
    };
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() => render(<Orphan />)).toThrow(
      'usePendingDocuments must be used within a PendingDocumentsProvider',
    );

    consoleError.mockRestore();
  });
});
