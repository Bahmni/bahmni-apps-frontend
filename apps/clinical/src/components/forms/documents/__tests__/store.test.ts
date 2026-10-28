import { uploadDocument } from '@bahmni/services';
import {
  createEmptyDocumentEntry,
  type DocumentEntry,
  type PendingDocument,
} from '@bahmni/widgets';
import { act } from '@testing-library/react';
import { useEncounterDetailsStore } from '../../../../stores/encounterDetailsStore';
import { useDocumentsStore } from '../store';
import {
  createPendingDocument,
  LAB_REPORT_TYPE,
  PATIENT_UUID,
} from './__mocks__/documentsMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  uploadDocument: jest.fn(),
}));

const mockUploadDocument = uploadDocument as jest.MockedFunction<
  typeof uploadDocument
>;

const state = () => useDocumentsStore.getState();
const addEntry = (): string => {
  const entry = createEmptyDocumentEntry();
  state().setEntries([...state().entries, entry]);
  return entry.id;
};
const patchEntry = (id: string, patch: Partial<DocumentEntry>) =>
  state().setEntries(
    state().entries.map((entry) =>
      entry.id === id ? { ...entry, ...patch } : entry,
    ),
  );
const setFiles = (id: string, files: PendingDocument[]) =>
  patchEntry(id, { files });
const updateDocumentType = (
  id: string,
  documentType: DocumentEntry['documentType'],
) => patchEntry(id, { documentType });
const updateDocumentId = (id: string, documentId: string) =>
  patchEntry(id, { documentId });
const updateNote = (id: string, note: string) => patchEntry(id, { note });
const removeEntry = (id: string) =>
  state().setEntries(state().entries.filter((entry) => entry.id !== id));

const entryOf = (id: string) => state().entries.find((e) => e.id === id)!;

const addValidEntry = async () => {
  const id = addEntry();
  updateDocumentType(id, LAB_REPORT_TYPE);
  setFiles(id, [createPendingDocument()]);
  await act(() => state().uploadPendingFiles());
  return id;
};

describe('useDocumentsStore', () => {
  beforeEach(() => {
    act(() => state().reset());
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = jest.fn();
    useEncounterDetailsStore.setState({
      patientUUID: PATIENT_UUID,
      selectedEncounterType: { uuid: 'enc-uuid', name: 'Patient Document' },
    });
    mockUploadDocument.mockResolvedValue({ url: '100/scan.png' } as never);
  });

  describe('entries', () => {
    it('adds an empty entry per card and removes by id', () => {
      const first = addEntry();
      const second = addEntry();

      expect(state().entries.map((e) => e.id)).toEqual([first, second]);

      removeEntry(first);

      expect(state().entries.map((e) => e.id)).toEqual([second]);
    });

    it('updates the type, identifier and note of one entry only', () => {
      const first = addEntry();
      const second = addEntry();

      updateDocumentType(first, LAB_REPORT_TYPE);
      updateDocumentId(first, 'DOC-1');
      updateNote(first, 'urgent');

      expect(entryOf(first)).toMatchObject({
        documentType: LAB_REPORT_TYPE,
        documentId: 'DOC-1',
        note: 'urgent',
      });
      expect(entryOf(second)).toMatchObject({
        documentType: null,
        documentId: '',
        note: '',
      });
    });
  });

  describe('picking files', () => {
    it('keeps the files without uploading them', () => {
      const id = addEntry();

      setFiles(id, [createPendingDocument()]);

      expect(mockUploadDocument).not.toHaveBeenCalled();
      expect(entryOf(id).files[0].uploadedUrl).toBeUndefined();
    });

    it('releases the previews it still holds when the store is reset', () => {
      const id = addEntry();
      setFiles(id, [createPendingDocument()]);

      state().reset();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
      expect(state().entries).toEqual([]);
    });
  });

  describe('uploadPendingFiles', () => {
    it('uploads each file against the encounter type and patient', async () => {
      const id = addEntry();
      updateDocumentType(id, LAB_REPORT_TYPE);
      const first = createPendingDocument('a.png');
      const second = createPendingDocument('b.png');
      setFiles(id, [first, second]);

      await act(() => state().uploadPendingFiles());

      expect(mockUploadDocument).toHaveBeenCalledWith(
        first.file,
        'Patient Document',
        PATIENT_UUID,
      );
      expect(mockUploadDocument).toHaveBeenCalledWith(
        second.file,
        'Patient Document',
        PATIENT_UUID,
      );
    });

    it('records the uploaded url once the upload finishes', async () => {
      const id = addEntry();
      setFiles(id, [createPendingDocument()]);

      await act(() => state().uploadPendingFiles());

      expect(entryOf(id).files[0]).toMatchObject({
        status: 'uploaded',
        uploadedUrl: '100/scan.png',
        fileName: 'scan.png',
        contentType: 'image/png',
        url: 'blob:preview',
      });
    });

    it('shows the files as uploading while the upload is in flight', async () => {
      const id = addEntry();
      mockUploadDocument.mockReturnValueOnce(new Promise(() => {}));
      setFiles(id, [createPendingDocument()]);

      void state().uploadPendingFiles();

      expect(entryOf(id).files[0].status).toBe('uploading');
    });

    it('marks a file as failed with the server message and still uploads the others', async () => {
      mockUploadDocument.mockRejectedValueOnce(new Error('Disk full'));
      const id = addEntry();
      setFiles(id, [
        createPendingDocument('a.png'),
        createPendingDocument('b.png'),
      ]);

      await act(() => state().uploadPendingFiles());

      expect(entryOf(id).files[0]).toMatchObject({
        status: 'error',
        error: 'Disk full',
      });
      expect(entryOf(id).files[1].status).toBe('uploaded');
    });

    it('does not upload a file again once it is uploaded', async () => {
      const id = addEntry();
      setFiles(id, [createPendingDocument('a.png')]);
      await act(() => state().uploadPendingFiles());

      setFiles(id, [...entryOf(id).files, createPendingDocument('b.png')]);
      await act(() => state().uploadPendingFiles());

      expect(mockUploadDocument).toHaveBeenCalledTimes(2);
    });

    it('retries a file that failed before', async () => {
      mockUploadDocument.mockRejectedValueOnce(new Error('nope'));
      const id = addEntry();
      setFiles(id, [createPendingDocument()]);
      await act(() => state().uploadPendingFiles());

      await act(() => state().uploadPendingFiles());

      expect(entryOf(id).files[0]).toMatchObject({
        status: 'uploaded',
        error: undefined,
      });
    });

    it('skips entries with nothing to save', async () => {
      addEntry();

      await act(() => state().uploadPendingFiles());

      expect(mockUploadDocument).not.toHaveBeenCalled();
    });
  });

  describe('hasFailedUploads', () => {
    it('is false when every file is uploaded', async () => {
      await addValidEntry();

      expect(state().hasFailedUploads()).toBe(false);
    });

    it('is true when a file could not be uploaded', async () => {
      mockUploadDocument.mockRejectedValueOnce(new Error('nope'));
      await addValidEntry();

      expect(state().hasFailedUploads()).toBe(true);
    });
  });

  describe('hasData', () => {
    it('ignores an untouched entry', () => {
      addEntry();

      expect(state().hasData()).toBe(false);
    });

    it.each([
      ['a type', (id: string) => updateDocumentType(id, LAB_REPORT_TYPE)],
      ['an identifier', (id: string) => updateDocumentId(id, 'D-1')],
      ['a note', (id: string) => updateNote(id, 'n')],
      ['a file', (id: string) => setFiles(id, [createPendingDocument()])],
    ])('is true once an entry has %s', (_label, change) => {
      change(addEntry());

      expect(state().hasData()).toBe(true);
    });
  });

  describe('validateAll', () => {
    it('passes when every touched entry has a type and a file', async () => {
      await addValidEntry();

      expect(state().validateAll()).toBe(true);
    });

    it('requires a document type', async () => {
      const id = addEntry();
      setFiles(id, [createPendingDocument()]);

      expect(state().validateAll()).toBe(false);
      expect(entryOf(id).errors).toEqual({
        documentType: 'DOCUMENTS_SELECT_DOCUMENT_TYPE',
      });
    });

    it('requires at least one file', () => {
      const id = addEntry();
      updateDocumentType(id, LAB_REPORT_TYPE);

      expect(state().validateAll()).toBe(false);
      expect(entryOf(id).errors).toEqual({
        files: 'DOCUMENTS_UPLOAD_A_DOCUMENT',
      });
    });

    it('requires the identifier only when configured as required', async () => {
      const id = await addValidEntry();
      state().setAttributes([{ name: 'documentId', required: true }]);

      expect(state().validateAll()).toBe(false);
      expect(entryOf(id).errors.documentId).toBe('INPUT_VALUE_REQUIRED');

      updateDocumentId(id, 'DOC-9');

      expect(state().validateAll()).toBe(true);
    });

    it('does not require a type when configured as optional', async () => {
      const id = addEntry();
      state().setAttributes([{ name: 'documentType', required: false }]);
      setFiles(id, [createPendingDocument()]);

      expect(state().validateAll()).toBe(true);
    });

    it('skips untouched entries', async () => {
      await addValidEntry();
      const untouched = addEntry();

      expect(state().validateAll()).toBe(true);
      expect(entryOf(untouched).errors).toEqual({});
    });
  });
});
