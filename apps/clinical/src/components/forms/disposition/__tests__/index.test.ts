import { notificationService } from '@bahmni/services';
import { useDispositionStore } from '../../../../stores/dispositionStore';
import { getRegisteredInputControls } from '../../registry';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  notificationService: {
    showInfo: jest.fn(),
    showSuccess: jest.fn(),
    showWarning: jest.fn(),
    showError: jest.fn(),
  },
}));

jest.mock('../Disposition', () => () => null);

const mockShowInfo = notificationService.showInfo as jest.MockedFunction<
  typeof notificationService.showInfo
>;

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

  it('createBundleEntries() is a deliberate no-op (save deferred)', () => {
    expect(getDispositionControl()!.createBundleEntries!({} as any)).toEqual(
      [],
    );
  });

  it('onSubmitSuccess() shows a "not implemented" notification when a type was selected', () => {
    useDispositionStore
      .getState()
      .setSelectedType({ value: 'ADMIT', label: 'Admit' });

    getDispositionControl()!.onSubmitSuccess!({} as any);

    expect(mockShowInfo).toHaveBeenCalledTimes(1);
  });

  it('onSubmitSuccess() does not notify when nothing was selected', () => {
    getDispositionControl()!.onSubmitSuccess!({} as any);

    expect(mockShowInfo).not.toHaveBeenCalled();
  });
});
