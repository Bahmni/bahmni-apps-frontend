import { uploadDocument } from '@bahmni/services';
import type { PendingDocument } from '@bahmni/widgets';
import { act } from '@testing-library/react';
import { useEncounterDetailsStore } from '../../../../stores/encounterDetailsStore';
import { useDocumentsStore } from '../store';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  uploadDocument: jest.fn(),
}));

const mockUploadDocument = uploadDocument as jest.MockedFunction<
  typeof uploadDocument
>;

const REPORT_TYPE = { id: 'type-1', label: 'Lab Report' };

const png = (name = 'scan.png') => new File(['x'], name, { type: 'image/png' });

const pending = (name = 'scan.png'): PendingDocument => ({
  id: `pending-${name}`,
  file: png(name),
  url: 'blob:preview',
  fileName: name,
  contentType: 'image/png',
  documentType: null,
  note: '',
  isNoteVisible: false,
});

const state = () => useDocumentsStore.getState();
const entryOf = (id: string) => state().entries.find((e) => e.id === id)!;

const flushUploads = () => act(async () => {});

const addValidEntry = async () => {
  const id = state().addEntry();
  state().updateDocumentType(id, REPORT_TYPE);
  state().setFiles(id, [pending()]);
  await flushUploads();
  return id;
};

describe('useDocumentsStore', () => {
  beforeEach(() => {
    act(() => state().reset());
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = jest.fn();
    useEncounterDetailsStore.setState({
      patientUUID: 'patient-uuid',
      selectedEncounterType: { uuid: 'enc-uuid', name: 'Patient Document' },
    });
    mockUploadDocument.mockResolvedValue({ url: '100/scan.png' } as never);
  });

  describe('entries', () => {
    it('adds an empty entry per card and removes by id', () => {
      const first = state().addEntry();
      const second = state().addEntry();

      expect(state().entries.map((e) => e.id)).toEqual([first, second]);

      state().removeEntry(first);

      expect(state().entries.map((e) => e.id)).toEqual([second]);
    });

    it('updates the type, identifier and note of one entry only', () => {
      const first = state().addEntry();
      const second = state().addEntry();

      state().updateDocumentType(first, REPORT_TYPE);
      state().updateDocumentId(first, 'DOC-1');
      state().updateNote(first, 'urgent');

      expect(entryOf(first)).toMatchObject({
        documentType: REPORT_TYPE,
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

  describe('uploading as soon as files are picked', () => {
    it('uploads each file against the encounter type and patient', async () => {
      const id = state().addEntry();
      const first = pending('a.png');
      const second = pending('b.png');

      state().setFiles(id, [first, second]);

      expect(mockUploadDocument).toHaveBeenCalledWith(
        first.file,
        'Patient Document',
        'patient-uuid',
      );
      expect(mockUploadDocument).toHaveBeenCalledWith(
        second.file,
        'Patient Document',
        'patient-uuid',
      );
      expect(entryOf(id).files.map((f) => f.status)).toEqual([
        'uploading',
        'uploading',
      ]);
    });

    it('records the uploaded url once the upload finishes', async () => {
      const id = state().addEntry();

      state().setFiles(id, [pending()]);
      await flushUploads();

      expect(entryOf(id).files[0]).toMatchObject({
        status: 'uploaded',
        uploadedUrl: '100/scan.png',
        fileName: 'scan.png',
        contentType: 'image/png',
        url: 'blob:preview',
      });
    });

    it('marks a file as failed with the server message when its upload fails', async () => {
      mockUploadDocument.mockRejectedValueOnce(new Error('Disk full'));
      const id = state().addEntry();

      state().setFiles(id, [pending()]);
      await flushUploads();

      expect(entryOf(id).files[0]).toMatchObject({
        status: 'error',
        error: 'Disk full',
      });
    });

    it('does not bring back a file that was removed while uploading', async () => {
      const id = state().addEntry();
      state().setFiles(id, [pending()]);

      state().setFiles(id, []);
      await flushUploads();

      expect(entryOf(id).files).toEqual([]);
    });

    it('attaches several files to the same document', async () => {
      const id = state().addEntry();

      state().setFiles(id, [pending('a.png')]);
      state().setFiles(id, [...entryOf(id).files, pending('b.png')]);
      await flushUploads();

      // The first file is not uploaded a second time when the list is replaced.
      expect(mockUploadDocument).toHaveBeenCalledTimes(2);
      expect(entryOf(id).files.map((f) => f.fileName)).toEqual([
        'a.png',
        'b.png',
      ]);
    });

    it('releases previews when an entry is removed or the store is reset', async () => {
      const removed = state().addEntry();
      state().setFiles(removed, [pending()]);
      state().removeEntry(removed);
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);

      const kept = state().addEntry();
      state().setFiles(kept, [pending()]);
      state().reset();

      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
      expect(state().entries).toEqual([]);
    });
  });

  describe('hasData', () => {
    it('ignores an untouched entry', () => {
      state().addEntry();

      expect(state().hasData()).toBe(false);
    });

    it.each([
      ['a type', (id: string) => state().updateDocumentType(id, REPORT_TYPE)],
      ['an identifier', (id: string) => state().updateDocumentId(id, 'D-1')],
      ['a note', (id: string) => state().updateNote(id, 'n')],
      ['a file', (id: string) => state().setFiles(id, [pending()])],
    ])('is true once an entry has %s', (_label, change) => {
      change(state().addEntry());

      expect(state().hasData()).toBe(true);
    });
  });

  describe('validateAll', () => {
    it('passes when every touched entry has a type and an uploaded file', async () => {
      await addValidEntry();

      expect(state().validateAll()).toBe(true);
    });

    it('requires a document type', async () => {
      const id = state().addEntry();
      state().setFiles(id, [pending()]);
      await flushUploads();

      expect(state().validateAll()).toBe(false);
      expect(entryOf(id).errors).toEqual({
        documentType: 'DOCUMENTS_SELECT_DOCUMENT_TYPE',
      });
    });

    it('requires at least one file', () => {
      const id = state().addEntry();
      state().updateDocumentType(id, REPORT_TYPE);

      expect(state().validateAll()).toBe(false);
      expect(entryOf(id).errors).toEqual({
        files: 'DOCUMENTS_UPLOAD_A_DOCUMENT',
      });
    });

    it('blocks while a file is still uploading', () => {
      const id = state().addEntry();
      state().updateDocumentType(id, REPORT_TYPE);
      mockUploadDocument.mockReturnValueOnce(new Promise(() => {}));
      state().setFiles(id, [pending()]);

      expect(state().validateAll()).toBe(false);
      expect(entryOf(id).errors.files).toBe('DOCUMENTS_UPLOAD_IN_PROGRESS');
    });

    it('blocks while a file has failed to upload', async () => {
      const id = state().addEntry();
      state().updateDocumentType(id, REPORT_TYPE);
      mockUploadDocument.mockRejectedValueOnce(new Error('nope'));
      state().setFiles(id, [pending()]);
      await flushUploads();

      expect(state().validateAll()).toBe(false);
      expect(entryOf(id).errors.files).toBe('DOCUMENTS_UPLOAD_FAILED_REMOVE');
    });

    it('requires the identifier only when configured as required', async () => {
      const id = await addValidEntry();
      state().setAttributes([{ name: 'documentId', required: true }]);

      expect(state().validateAll()).toBe(false);
      expect(entryOf(id).errors.documentId).toBe('INPUT_VALUE_REQUIRED');

      state().updateDocumentId(id, 'DOC-9');

      expect(state().validateAll()).toBe(true);
    });

    it('does not require a type when configured as optional', async () => {
      const id = state().addEntry();
      state().setAttributes([{ name: 'documentType', required: false }]);
      state().setFiles(id, [pending()]);
      await flushUploads();

      expect(state().validateAll()).toBe(true);
    });

    it('skips untouched entries', async () => {
      await addValidEntry();
      const untouched = state().addEntry();

      expect(state().validateAll()).toBe(true);
      expect(entryOf(untouched).errors).toEqual({});
    });

    it('clears an error when its field is corrected', () => {
      const id = state().addEntry();
      state().updateNote(id, 'only a note');
      state().validateAll();
      expect(entryOf(id).errors.documentType).toBeDefined();

      state().updateDocumentType(id, REPORT_TYPE);

      expect(entryOf(id).errors.documentType).toBeUndefined();
    });
  });

  it('flags the missing document type on request', () => {
    const id = state().addEntry();

    state().showDocumentTypeRequired(id);

    expect(entryOf(id).errors.documentType).toBe(
      'DOCUMENTS_SELECT_DOCUMENT_TYPE',
    );
  });
});
