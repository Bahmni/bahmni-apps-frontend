import { clearRegistry, getRegisteredInputControls } from '../../registry';
import { DOCUMENTS_INPUT_CONTROL_KEY } from '../constants';
import { useDocumentsStore } from '../store';

import '../index';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  uploadDocument: jest.fn(),
}));

const loadControl = () =>
  getRegisteredInputControls().find(
    (control) => control.key === DOCUMENTS_INPUT_CONTROL_KEY,
  )!;

jest.mock('../DocumentsForm', () => 'DocumentsForm');

afterAll(() => clearRegistry());

describe('documents input control registration', () => {
  beforeEach(() => useDocumentsStore.getState().reset());

  it('registers under the documents key', () => {
    expect(loadControl()).toBeDefined();
  });

  it('reports data only once a card has been touched', () => {
    const control = loadControl();
    const id = useDocumentsStore.getState().addEntry();
    expect(control.hasData()).toBe(false);

    useDocumentsStore.getState().updateDocumentId(id, 'DOC-1');

    expect(control.hasData()).toBe(true);
  });

  it('validates through the store', () => {
    const control = loadControl();
    const id = useDocumentsStore.getState().addEntry();
    useDocumentsStore.getState().updateDocumentId(id, 'DOC-1');

    expect(control.validate()).toBe(false);
  });

  it('notifies subscribers when the store changes', () => {
    const control = loadControl();
    const listener = jest.fn();
    const unsubscribe = control.subscribe(listener);

    useDocumentsStore.getState().addEntry();
    unsubscribe();
    useDocumentsStore.getState().addEntry();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('builds one DocumentReference per card for the encounter', () => {
    const control = loadControl();
    const store = useDocumentsStore.getState();
    const id = store.addEntry();
    store.updateDocumentId(id, 'DOC-1');

    const entries = control.createBundleEntries!({
      encounterSubject: { reference: 'Patient/patient-uuid' },
      encounterReference: 'urn:uuid:encounter',
      practitionerUUID: 'practitioner-uuid',
      consultationDate: new Date(),
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].resource?.resourceType).toBe('DocumentReference');
  });

  it('resets the store', () => {
    const control = loadControl();
    useDocumentsStore.getState().addEntry();

    control.reset();

    expect(useDocumentsStore.getState().entries).toEqual([]);
  });
});
