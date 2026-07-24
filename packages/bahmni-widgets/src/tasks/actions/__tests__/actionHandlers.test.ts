import {
  mockLaunchFormAction,
  mockTaskViewModelWithInput,
  mockTaskViewModelWithoutInput,
  mockTaskViewModelWithLabForm,
  mockTaskViewModelWithCaseInsensitiveForm,
  mockTaskViewModelWithNonexistentForm,
  mockObservationForms,
  mockUserPrivileges,
  mockEmptyUserPrivileges,
} from '../../__tests__/__mocks__/taskActionsMocks';
import { isFormActionVisible } from '../../utils';
import { handleTaskAction } from '../actionHandlers';

describe('isFormActionVisible', () => {
  describe('launchForm action type', () => {
    const generalFormTask = {
      ...mockTaskViewModelWithInput,
      fhirResource: {
        ...mockTaskViewModelWithInput.fhirResource,
        input: [
          {
            type: {
              coding: [
                {
                  code: 'form-name-input-type',
                  display: 'Form Name',
                },
              ],
            },
            valueString: 'General Form',
          },
        ],
      },
    };

    it.each([
      [
        'valid form with privileges',
        mockTaskViewModelWithInput,
        mockUserPrivileges,
        true,
      ],
      ['no input', mockTaskViewModelWithoutInput, mockUserPrivileges, false],
      [
        'nonexistent form',
        mockTaskViewModelWithNonexistentForm,
        mockUserPrivileges,
        false,
      ],
      [
        'empty privileges',
        mockTaskViewModelWithInput,
        mockEmptyUserPrivileges,
        false,
      ],
      ['null privileges', mockTaskViewModelWithInput, null, false],
      [
        'case-insensitive form name',
        mockTaskViewModelWithCaseInsensitiveForm,
        mockUserPrivileges,
        true,
      ],
      [
        'form with no privileges configured',
        generalFormTask,
        mockUserPrivileges,
        true,
      ],
    ])('should handle %s', (_desc, task, privileges, expected) => {
      expect(
        isFormActionVisible(
          mockLaunchFormAction,
          task,
          mockObservationForms,
          privileges,
        ),
      ).toBe(expected);
    });
  });

  describe('unknown action types', () => {
    it('should return false for unknown action type', () => {
      const unknownAction = {
        ...mockLaunchFormAction,
        type: 'unknownType',
      };

      const visible = isFormActionVisible(
        unknownAction,
        mockTaskViewModelWithInput,
        mockObservationForms,
        mockUserPrivileges,
      );
      expect(visible).toBe(false);
    });
  });
});

describe('handleTaskAction', () => {
  let dispatchEventSpy: jest.SpyInstance;

  beforeEach(() => {
    dispatchEventSpy = jest.spyOn(globalThis, 'dispatchEvent');
  });

  afterEach(() => {
    dispatchEventSpy.mockRestore();
  });

  describe('launchForm action type', () => {
    it('should dispatch startConsultation event with correct detail', () => {
      handleTaskAction(mockLaunchFormAction, mockTaskViewModelWithInput);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'startConsultation',
          detail: {
            encounterType: 'consultation',
            taskFormName: 'Vitals',
            directFormMode: true,
            editOnly: 'observationForms',
            task: mockTaskViewModelWithInput.fhirResource,
          },
        }),
      );
    });

    it('should pass custom encounterType from handler config', () => {
      const customAction = {
        ...mockLaunchFormAction,
        handlerConfig: {
          ...mockLaunchFormAction.handlerConfig,
          encounterType: 'emergency',
        },
      };

      handleTaskAction(customAction, mockTaskViewModelWithInput);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            encounterType: 'emergency',
          }),
        }),
      );
    });

    it.each([
      ['Vitals', mockTaskViewModelWithInput],
      ['Lab Tests', mockTaskViewModelWithLabForm],
      ['VITALS', mockTaskViewModelWithCaseInsensitiveForm],
      [null, mockTaskViewModelWithoutInput],
    ])('should extract form name %s from task', (expectedFormName, task) => {
      handleTaskAction(mockLaunchFormAction, task);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            taskFormName: expectedFormName,
          }),
        }),
      );
    });
  });

  describe('unknown action types', () => {
    it('should not dispatch event for unknown action type', () => {
      const unknownAction = {
        ...mockLaunchFormAction,
        type: 'unknownType',
      };

      handleTaskAction(unknownAction, mockTaskViewModelWithInput);

      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });
  });
});
