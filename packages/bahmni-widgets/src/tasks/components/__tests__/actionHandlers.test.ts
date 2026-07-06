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
import { isActionVisible, handleTaskAction } from '../actionHandlers';

describe('isActionVisible', () => {
  describe('launchForm action type', () => {
    it('should return false when formName cannot be extracted', () => {
      const visible = isActionVisible(
        mockLaunchFormAction,
        mockTaskViewModelWithoutInput,
        mockObservationForms,
        mockUserPrivileges,
      );
      expect(visible).toBe(false);
    });

    it('should return false when no matching form found', () => {
      const visible = isActionVisible(
        mockLaunchFormAction,
        mockTaskViewModelWithNonexistentForm,
        mockObservationForms,
        mockUserPrivileges,
      );
      expect(visible).toBe(false);
    });

    it('should return true when user can edit matching form', () => {
      const visible = isActionVisible(
        mockLaunchFormAction,
        mockTaskViewModelWithInput,
        mockObservationForms,
        mockUserPrivileges,
      );
      expect(visible).toBe(true);
    });

    it('should return false when user lacks form edit privileges', () => {
      const visible = isActionVisible(
        mockLaunchFormAction,
        mockTaskViewModelWithInput,
        mockObservationForms,
        mockEmptyUserPrivileges,
      );
      expect(visible).toBe(false);
    });

    it('should handle case-insensitive form name matching', () => {
      const visible = isActionVisible(
        mockLaunchFormAction,
        mockTaskViewModelWithCaseInsensitiveForm,
        mockObservationForms,
        mockUserPrivileges,
      );
      expect(visible).toBe(true);
    });

    it('should return false when userPrivileges is null', () => {
      const visible = isActionVisible(
        mockLaunchFormAction,
        mockTaskViewModelWithInput,
        mockObservationForms,
        null,
      );
      expect(visible).toBe(false);
    });

    it('should return true when form has no privileges configured', () => {
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

      const visible = isActionVisible(
        mockLaunchFormAction,
        generalFormTask,
        mockObservationForms,
        mockUserPrivileges,
      );
      expect(visible).toBe(true);
    });

    it.each([
      [
        'task with input, valid form, user has privilege',
        mockTaskViewModelWithInput,
        mockUserPrivileges,
        true,
      ],
      [
        'task without input',
        mockTaskViewModelWithoutInput,
        mockUserPrivileges,
        false,
      ],
      [
        'task with nonexistent form',
        mockTaskViewModelWithNonexistentForm,
        mockUserPrivileges,
        false,
      ],
      [
        'task with input, user has no privileges',
        mockTaskViewModelWithInput,
        mockEmptyUserPrivileges,
        false,
      ],
      [
        'task with input, userPrivileges is null',
        mockTaskViewModelWithInput,
        null,
        false,
      ],
    ])('should handle %s correctly', (_, task, privileges, expectedVisible) => {
      const visible = isActionVisible(
        mockLaunchFormAction,
        task,
        mockObservationForms,
        privileges,
      );
      expect(visible).toBe(expectedVisible);
    });
  });

  describe('unknown action types', () => {
    it('should return false for unknown action type', () => {
      const unknownAction = {
        ...mockLaunchFormAction,
        type: 'unknownType',
      };

      const visible = isActionVisible(
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

    it('should extract form name from task input', () => {
      handleTaskAction(mockLaunchFormAction, mockTaskViewModelWithLabForm);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            taskFormName: 'Lab Tests',
          }),
        }),
      );
    });

    it('should pass encounterType from handler config', () => {
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

    it('should set directFormMode to true', () => {
      handleTaskAction(mockLaunchFormAction, mockTaskViewModelWithInput);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            directFormMode: true,
          }),
        }),
      );
    });

    it('should set editOnly to observationForms', () => {
      handleTaskAction(mockLaunchFormAction, mockTaskViewModelWithInput);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            editOnly: 'observationForms',
          }),
        }),
      );
    });

    it('should pass task FHIR resource', () => {
      handleTaskAction(mockLaunchFormAction, mockTaskViewModelWithInput);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            task: mockTaskViewModelWithInput.fhirResource,
          }),
        }),
      );
    });

    it('should handle task without form name gracefully', () => {
      handleTaskAction(mockLaunchFormAction, mockTaskViewModelWithoutInput);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            taskFormName: null,
          }),
        }),
      );
    });

    it.each([
      ['Vitals', mockTaskViewModelWithInput, 'consultation'],
      ['Lab Tests', mockTaskViewModelWithLabForm, 'consultation'],
      ['VITALS', mockTaskViewModelWithCaseInsensitiveForm, 'consultation'],
    ])(
      'should dispatch event for %s form with encounterType %s',
      (expectedFormName, task, encounterType) => {
        handleTaskAction(mockLaunchFormAction, task);

        expect(dispatchEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              taskFormName: expectedFormName,
              encounterType,
            }),
          }),
        );
      },
    );
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
