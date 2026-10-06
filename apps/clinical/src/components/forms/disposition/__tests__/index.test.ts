import { useDispositionStore } from '../../../../stores/dispositionStore';
import { getRegisteredInputControls } from '../../registry';

jest.mock('../Disposition', () => () => null);

const mockContext = {
  encounterSubject: { reference: 'Patient/patient-uuid' },
  encounterReference: 'urn:uuid:encounter-uuid',
  practitionerUUID: 'practitioner-uuid',
  consultationDate: new Date('2024-01-01'),
} as any;

describe('disposition input control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispositionStore.getState().reset();
  });

  beforeAll(async () => {
    await import('../index');
  });

  function getDispositionControl() {
    const controls = getRegisteredInputControls();
    return controls.find((c) => c.key === 'disposition');
  }

  it('registers with key "disposition"', () => {
    const control = getDispositionControl();
    expect(control).toBeDefined();
    expect(control!.key).toBe('disposition');
  });

  it('reset() calls store reset', () => {
    useDispositionStore
      .getState()
      .setSelectedType({ value: 'ADMIT', label: 'Admit' });

    getDispositionControl()!.reset();

    expect(useDispositionStore.getState().selectedType).toBeNull();
  });

  it('validate() delegates to the store', () => {
    expect(getDispositionControl()!.validate()).toBe(false);

    useDispositionStore
      .getState()
      .setSelectedType({ value: 'ADMIT', label: 'Admit' });

    expect(getDispositionControl()!.validate()).toBe(true);
  });

  it('hasData() reflects whether a type has been selected', () => {
    expect(getDispositionControl()!.hasData()).toBe(false);

    useDispositionStore
      .getState()
      .setSelectedType({ value: 'ADMIT', label: 'Admit' });

    expect(getDispositionControl()!.hasData()).toBe(true);
  });

  it('createBundleEntries() returns no entries when nothing was selected', () => {
    expect(getDispositionControl()!.createBundleEntries!(mockContext)).toEqual(
      [],
    );
  });

  it('createBundleEntries() returns a ServiceRequest entry when a type was selected', () => {
    useDispositionStore.getState().setSelectedType({
      value: 'ADMIT',
      label: 'Admit',
      conceptUuid: 'admit-concept-uuid',
    });
    useDispositionStore.getState().setNotes('Admitting for observation');

    const entries = getDispositionControl()!.createBundleEntries!(mockContext);

    expect(entries).toHaveLength(1);
    expect(entries[0].request?.method).toBe('POST');
    const resource = entries[0].resource as any;
    expect(resource.resourceType).toBe('ServiceRequest');
    expect(resource.code?.coding?.[0]?.code).toBe('admit-concept-uuid');
    expect(resource.note?.[0]?.text).toBe('Admitting for observation');
  });

  it('createBundleEntries() falls back to the disposition value when no conceptUuid is configured', () => {
    useDispositionStore
      .getState()
      .setSelectedType({ value: 'ADMIT', label: 'Admit' });

    const entries = getDispositionControl()!.createBundleEntries!(mockContext);

    const resource = entries[0].resource as any;
    expect(resource.code?.coding?.[0]?.code).toBe('ADMIT');
  });
});
