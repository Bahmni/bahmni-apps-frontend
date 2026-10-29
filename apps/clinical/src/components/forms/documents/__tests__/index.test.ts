import { clearRegistry, getRegisteredInputControls } from '../../registry';
import { DOCUMENTS_INPUT_CONTROL_KEY } from '../constants';
import { useDocumentsStore } from '../store';

import {
  createBlankDocumentEntry,
  createPendingDocument,
  ENCOUNTER_REFERENCE,
  PATIENT_UUID,
  PRACTITIONER_UUID,
} from './__mocks__/documentsMocks';

import '../index';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  uploadDocument: jest.fn(),
}));

const addEntry = (documentId = '') => {
  const entry = createBlankDocumentEntry(documentId);
  const store = useDocumentsStore.getState();
  store.setEntries([...store.entries, entry]);
  return entry.id;
};

const loadControl = () =>
  getRegisteredInputControls().find(
    (control) => control.key === DOCUMENTS_INPUT_CONTROL_KEY,
  )!;

jest.mock('../DocumentsForm', () => 'DocumentsForm');

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  global.URL.revokeObjectURL = jest.fn();
});

afterAll(() => clearRegistry());

describe('documents input control registration', () => {
  beforeEach(() => useDocumentsStore.getState().reset());

  it('registers under the documents key', () => {
    expect(loadControl()).toBeDefined();
  });

  it('reports data only once a card has been touched', () => {
    const control = loadControl();
    addEntry();
    expect(control.hasData()).toBe(false);

    useDocumentsStore.getState().reset();
    addEntry('DOC-1');

    expect(control.hasData()).toBe(true);
  });

  it('validates through the store', () => {
    const control = loadControl();
    addEntry('DOC-1');

    expect(control.validate()).toBe(false);
  });

  it('notifies subscribers when the store changes', () => {
    const control = loadControl();
    const listener = jest.fn();
    const unsubscribe = control.subscribe(listener);

    addEntry();
    unsubscribe();
    addEntry();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('builds one DocumentReference per card for the encounter', () => {
    const control = loadControl();
    addEntry('DOC-1');

    const entries = control.createBundleEntries!({
      encounterSubject: { reference: `Patient/${PATIENT_UUID}` },
      encounterReference: ENCOUNTER_REFERENCE,
      practitionerUUID: PRACTITIONER_UUID,
      consultationDate: new Date(),
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].resource?.resourceType).toBe('DocumentReference');
  });

  describe('uploading on submit', () => {
    const mockUploadDocument = jest.requireMock('@bahmni/services')
      .uploadDocument as jest.Mock;
    const addEntryWithFile = () => {
      const entry = {
        ...createBlankDocumentEntry('DOC-1'),
        files: [createPendingDocument('a.png')],
      };
      useDocumentsStore.getState().setEntries([entry]);
    };
    const ctx = {
      encounterSubject: { reference: `Patient/${PATIENT_UUID}` },
      encounterReference: ENCOUNTER_REFERENCE,
      practitionerUUID: PRACTITIONER_UUID,
      consultationDate: new Date(),
    };

    beforeEach(() => {
      mockUploadDocument.mockReset();
    });

    it('uploads the files before the bundle entries are built', async () => {
      mockUploadDocument.mockResolvedValue({ url: '100/a.png' });
      const control = loadControl();
      addEntryWithFile();

      await control.prepareBundleEntries!();

      expect(mockUploadDocument).toHaveBeenCalledTimes(1);
      const entries = control.createBundleEntries!(ctx);
      expect(entries).toHaveLength(1);
    });

    it('rejects, so the consultation is not saved, when a document fails to upload', async () => {
      mockUploadDocument.mockRejectedValue(new Error('Disk full'));
      const control = loadControl();
      addEntryWithFile();

      await expect(control.prepareBundleEntries!()).rejects.toThrow(
        'DOCUMENTS_NOT_SAVED_MESSAGE',
      );
    });

    it('rejects when only one of several files fails, and keeps the ones that uploaded', async () => {
      mockUploadDocument
        .mockResolvedValueOnce({ url: '100/a.png' })
        .mockRejectedValueOnce(new Error('Disk full'));
      const control = loadControl();
      useDocumentsStore.getState().setEntries([
        {
          ...createBlankDocumentEntry('DOC-1'),
          files: [
            createPendingDocument('a.png'),
            createPendingDocument('b.png'),
          ],
        },
      ]);

      await expect(control.prepareBundleEntries!()).rejects.toThrow(
        'DOCUMENTS_NOT_SAVED_MESSAGE',
      );

      const [first, second] = useDocumentsStore.getState().entries[0].files;
      expect(first.uploadedUrl).toBe('100/a.png');
      expect(second.uploadedUrl).toBeUndefined();
    });

    it('retries only the failed file on the next attempt', async () => {
      mockUploadDocument
        .mockResolvedValueOnce({ url: '100/a.png' })
        .mockRejectedValueOnce(new Error('Disk full'))
        .mockResolvedValueOnce({ url: '100/b.png' });
      const control = loadControl();
      useDocumentsStore.getState().setEntries([
        {
          ...createBlankDocumentEntry('DOC-1'),
          files: [
            createPendingDocument('a.png'),
            createPendingDocument('b.png'),
          ],
        },
      ]);
      await expect(control.prepareBundleEntries!()).rejects.toThrow(
        'DOCUMENTS_NOT_SAVED_MESSAGE',
      );

      await expect(control.prepareBundleEntries!()).resolves.toBeUndefined();

      expect(mockUploadDocument).toHaveBeenCalledTimes(3);
      expect(control.createBundleEntries!(ctx)).toHaveLength(1);
    });
  });

  it('resets the store', () => {
    const control = loadControl();
    addEntry();

    control.reset();

    expect(useDocumentsStore.getState().entries).toEqual([]);
  });
});
