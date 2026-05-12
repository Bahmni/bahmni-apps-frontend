import { handleAction } from '../components/actionHandlers';
import {
  multipleActionsMock,
  singleActionMock,
} from './__mocks__/actionsMocks';
import { fhirMedicationRequestMock } from './__mocks__/medicationMocks';

describe('handleAction', () => {
  let dispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    dispatchSpy = jest.spyOn(globalThis, 'dispatchEvent');
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
  });

  it('dispatches startConsultation with encounterType and basedOn for administer action', () => {
    handleAction(singleActionMock[0], fhirMedicationRequestMock);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'startConsultation',
        detail: {
          encounterType: singleActionMock[0].encounterType,
          basedOn: fhirMedicationRequestMock,
        },
      }),
    );
  });

  it('does not dispatch any event for unknown action types', () => {
    handleAction(multipleActionsMock[1], undefined);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
