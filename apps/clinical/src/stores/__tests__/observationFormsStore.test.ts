import { ObservationForm, Form2Observation } from '@bahmni/services';
import { act, renderHook } from '@testing-library/react';
import {
  VALIDATION_STATE_EMPTY,
  VALIDATION_STATE_MANDATORY,
  VALIDATION_STATE_INVALID,
} from '../../constants/forms';
import { useObservationFormsStore } from '../observationFormsStore';

describe('observationFormsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useObservationFormsStore());
    act(() => {
      result.current.reset();
    });
  });

  const mockForm1: ObservationForm = {
    uuid: 'form-1',
    name: 'Test Form 1',
    id: 1,
    privileges: [],
  };

  const mockForm2: ObservationForm = {
    uuid: 'form-2',
    name: 'Test Form 2',
    id: 2,
    privileges: [],
  };

  const mockObservations: Form2Observation[] = [
    {
      concept: {
        uuid: 'concept-1',
        datatype: 'Text',
      },
      value: 'Test Value',
    },
  ];

  describe('Initial State', () => {
    it('should have empty initial state', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      expect(result.current.selectedForms).toEqual([]);
      expect(result.current.formsData).toEqual({});
      expect(result.current.viewingForm).toBeNull();
    });
  });

  describe('addForm', () => {
    it('should add a form to selectedForms', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
      });

      expect(result.current.selectedForms).toHaveLength(1);
      expect(result.current.selectedForms[0]).toEqual(mockForm1);
      expect(result.current.viewingForm).toEqual(mockForm1);
    });

    it('should not add duplicate forms', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.addForm(mockForm1);
      });

      expect(result.current.selectedForms).toHaveLength(1);
      expect(result.current.viewingForm).toEqual(mockForm1);
    });

    it('should set viewingForm when adding duplicate', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.setViewingForm(null);
        result.current.addForm(mockForm1);
      });

      expect(result.current.selectedForms).toHaveLength(1);
      expect(result.current.viewingForm).toEqual(mockForm1);
    });

    it('should add multiple different forms', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.addForm(mockForm2);
      });

      expect(result.current.selectedForms).toHaveLength(2);
      expect(result.current.selectedForms).toContainEqual(mockForm1);
      expect(result.current.selectedForms).toContainEqual(mockForm2);
    });

    it('should not add form with invalid uuid', () => {
      const { result } = renderHook(() => useObservationFormsStore());
      const invalidForm = { ...mockForm1, uuid: '' };

      act(() => {
        result.current.addForm(invalidForm as ObservationForm);
      });

      expect(result.current.selectedForms).toHaveLength(0);
      expect(result.current.viewingForm).toBeNull();
    });

    it('should not add form without name', () => {
      const { result } = renderHook(() => useObservationFormsStore());
      const invalidForm = { ...mockForm1, name: '' };

      act(() => {
        result.current.addForm(invalidForm as ObservationForm);
      });

      expect(result.current.selectedForms).toHaveLength(0);
    });
  });

  describe('removeForm', () => {
    it('should remove a form from selectedForms', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.addForm(mockForm2);
        result.current.removeForm('form-1');
      });

      expect(result.current.selectedForms).toHaveLength(1);
      expect(result.current.selectedForms[0]).toEqual(mockForm2);
    });

    it('should remove form data when removing form', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData('form-1', mockObservations);
        result.current.removeForm('form-1');
      });

      expect(result.current.formsData['form-1']).toBeUndefined();
    });

    it('should clear viewingForm if removed form is being viewed', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.removeForm('form-1');
      });

      expect(result.current.viewingForm).toBeNull();
    });

    it('should not clear viewingForm if different form is removed', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.addForm(mockForm2);
        result.current.setViewingForm(mockForm1);
        result.current.removeForm('form-2');
      });

      expect(result.current.viewingForm).toEqual(mockForm1);
    });

    it('should not error when removing non-existent form', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.removeForm('non-existent');
      });

      expect(result.current.selectedForms).toHaveLength(1);
    });

    it('should not remove form with invalid uuid', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.removeForm('');
      });

      expect(result.current.selectedForms).toHaveLength(1);
    });
  });

  describe('updateFormData', () => {
    it('should update form data for a selected form', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData('form-1', mockObservations);
      });

      const formData = result.current.formsData['form-1'];
      expect(formData).toBeDefined();
      expect(formData.formUuid).toBe('form-1');
      expect(formData.formName).toBe('Test Form 1');
      expect(formData.observations).toEqual(mockObservations);
      expect(formData.timestamp).toBeGreaterThan(0);
    });

    it('should not update data for non-selected form', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.updateFormData('non-existent', mockObservations);
      });

      expect(result.current.formsData['non-existent']).toBeUndefined();
    });

    it('should update timestamp when updating form data', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData('form-1', mockObservations);
      });

      const firstTimestamp = result.current.formsData['form-1'].timestamp;

      act(() => {
        result.current.updateFormData('form-1', [
          ...mockObservations,
          { ...mockObservations[0], value: 'Updated' },
        ]);
      });

      expect(
        result.current.formsData['form-1'].timestamp,
      ).toBeGreaterThanOrEqual(firstTimestamp);
    });

    it('should not update form data with invalid uuid', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData('', mockObservations);
      });

      expect(result.current.formsData['']).toBeUndefined();
    });

    it('should update form data with validation state', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData(
          'form-1',
          mockObservations,
          VALIDATION_STATE_MANDATORY,
        );
      });

      const formData = result.current.formsData['form-1'];
      expect(formData.validationErrorType).toBe(VALIDATION_STATE_MANDATORY);
    });

    it('should update validation state to null when form is fixed', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData(
          'form-1',
          mockObservations,
          VALIDATION_STATE_MANDATORY,
        );
      });

      expect(result.current.formsData['form-1'].validationErrorType).toBe(
        VALIDATION_STATE_MANDATORY,
      );

      act(() => {
        result.current.updateFormData('form-1', mockObservations, null);
      });

      expect(result.current.formsData['form-1'].validationErrorType).toBeNull();
    });

    it('should update validation state from one type to another', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData('form-1', [], VALIDATION_STATE_EMPTY);
      });

      expect(result.current.formsData['form-1'].validationErrorType).toBe(
        VALIDATION_STATE_EMPTY,
      );

      act(() => {
        result.current.updateFormData(
          'form-1',
          mockObservations,
          VALIDATION_STATE_INVALID,
        );
      });

      expect(result.current.formsData['form-1'].validationErrorType).toBe(
        VALIDATION_STATE_INVALID,
      );
    });
  });

  describe('getFormData', () => {
    it('should return form data for a form', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData('form-1', mockObservations);
      });

      const data = result.current.getFormData('form-1');
      expect(data?.observations).toEqual(mockObservations);
    });

    it('should return undefined for non-existent form', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      const data = result.current.getFormData('non-existent');
      expect(data).toBeUndefined();
    });

    it('should return undefined for invalid uuid', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      const data = result.current.getFormData('');
      expect(data).toBeUndefined();
    });
  });

  describe('setViewingForm', () => {
    it('should set the viewing form', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.setViewingForm(mockForm1);
      });

      expect(result.current.viewingForm).toEqual(mockForm1);
    });

    it('should clear the viewing form', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.setViewingForm(null);
      });

      expect(result.current.viewingForm).toBeNull();
    });

    it('should not set invalid form as viewing form', () => {
      const { result } = renderHook(() => useObservationFormsStore());
      const invalidForm = { ...mockForm1, uuid: '' };

      act(() => {
        result.current.setViewingForm(invalidForm as ObservationForm);
      });

      expect(result.current.viewingForm).toBeNull();
    });
  });

  describe('getAllObservations', () => {
    it('should return all observations from all forms', () => {
      const { result } = renderHook(() => useObservationFormsStore());
      const observations2: Form2Observation[] = [
        {
          concept: {
            uuid: 'concept-2',
            datatype: 'Numeric',
          },
          value: '42',
        },
      ];

      act(() => {
        result.current.addForm(mockForm1);
        result.current.addForm(mockForm2);
        result.current.updateFormData('form-1', mockObservations);
        result.current.updateFormData('form-2', observations2);
      });

      const allObs = result.current.getAllObservations();
      expect(allObs).toHaveLength(2);
      expect(allObs).toContainEqual(mockObservations[0]);
      expect(allObs).toContainEqual(observations2[0]);
    });

    it('should return empty array when no forms have data', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
      });

      const allObs = result.current.getAllObservations();
      expect(allObs).toEqual([]);
    });
  });

  describe('getObservationFormsData', () => {
    it('should return observation data grouped by form uuid', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.addForm(mockForm2);
        result.current.updateFormData('form-1', mockObservations);
      });

      const formsData = result.current.getObservationFormsData();
      expect(formsData['form-1']).toEqual(mockObservations);
      expect(formsData['form-2']).toBeUndefined();
    });

    it('should return empty object when no forms have data', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      const formsData = result.current.getObservationFormsData();
      expect(formsData).toEqual({});
    });
  });

  describe('validate', () => {
    it('should return true when no forms are selected', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      expect(result.current.validate()).toBe(true);
    });

    it('should return true when all selected forms have data and no validation errors', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData('form-1', mockObservations, null);
      });

      expect(result.current.validate()).toBe(true);
    });

    it('should return false when selected form has no data', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
      });

      expect(result.current.validate()).toBe(false);
    });

    it('should return false when selected form has empty observations', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData('form-1', []);
      });

      expect(result.current.validate()).toBe(false);
    });

    it('should return false when a selected form has mandatory validation error', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData(
          'form-1',
          mockObservations,
          VALIDATION_STATE_MANDATORY,
        );
      });

      expect(result.current.validate()).toBe(false);
    });

    it('should return false when a selected form has empty validation error', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData('form-1', [], VALIDATION_STATE_EMPTY);
      });

      expect(result.current.validate()).toBe(false);
    });

    it('should return false when a selected form has invalid validation error', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData(
          'form-1',
          mockObservations,
          VALIDATION_STATE_INVALID,
        );
      });

      expect(result.current.validate()).toBe(false);
    });

    it('should return false when at least one form has validation error', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.addForm(mockForm2);
        result.current.updateFormData('form-1', mockObservations, null); // Valid
        result.current.updateFormData('form-2', [], VALIDATION_STATE_EMPTY); // Error
      });

      expect(result.current.validate()).toBe(false);
    });

    it('should return false when all forms have invalid errors', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.addForm(mockForm2);
        result.current.updateFormData(
          'form-1',
          mockObservations,
          VALIDATION_STATE_INVALID,
        );
        result.current.updateFormData(
          'form-2',
          mockObservations,
          VALIDATION_STATE_INVALID,
        );
      });

      expect(result.current.validate()).toBe(false);
    });

    it('should validate all selected forms have data and no errors', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.addForm(mockForm2);
        result.current.updateFormData('form-1', mockObservations, null);
      });

      // Form 2 has no data, should fail
      expect(result.current.validate()).toBe(false);

      act(() => {
        result.current.updateFormData('form-2', mockObservations, null);
      });

      // Both forms have data and no errors, should pass
      expect(result.current.validate()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
        result.current.updateFormData('form-1', mockObservations);
        result.current.setViewingForm(mockForm1);
        result.current.reset();
      });

      expect(result.current.selectedForms).toEqual([]);
      expect(result.current.formsData).toEqual({});
      expect(result.current.viewingForm).toBeNull();
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const { result } = renderHook(() => useObservationFormsStore());

      act(() => {
        result.current.addForm(mockForm1);
      });

      const state = result.current.getState();
      expect(state.selectedForms).toHaveLength(1);
      expect(state.selectedForms[0]).toEqual(mockForm1);
    });
  });
});
