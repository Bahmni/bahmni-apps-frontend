import { renderHook } from '@testing-library/react';
import { MedicationRequest } from 'fhir/r4';
import { act } from 'react';
import { useStopMedicationStore } from '../stopMedicationsStore';

const mockMedicationRequest: MedicationRequest = {
  resourceType: 'MedicationRequest',
  id: 'med-req-1',
  status: 'active',
  intent: 'order',
  subject: { reference: 'Patient/patient-uuid-1' },
  medicationReference: {
    reference: 'Medication/med-1',
    display: 'Paracetamol 500mg',
  },
  encounter: { reference: 'Encounter/enc-uuid-1' },
};

describe('useStopMedicationStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useStopMedicationStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial state', () => {
    it('should have stopDate set to today', () => {
      const { result } = renderHook(() => useStopMedicationStore());
      const today = new Date();
      expect(result.current.stopDate.toDateString()).toBe(today.toDateString());
    });

    it('should have stopReason as null', () => {
      const { result } = renderHook(() => useStopMedicationStore());
      expect(result.current.stopReason).toBeNull();
    });

    it('should have note as empty string', () => {
      const { result } = renderHook(() => useStopMedicationStore());
      expect(result.current.note).toBe('');
    });

    it('should have medicationToStop as null', () => {
      const { result } = renderHook(() => useStopMedicationStore());
      expect(result.current.medicationToStop).toBeNull();
    });

    it('should have empty errors object', () => {
      const { result } = renderHook(() => useStopMedicationStore());
      expect(result.current.errors).toEqual({});
    });

    it('should have default fieldConfig', () => {
      const { result } = renderHook(() => useStopMedicationStore());
      expect(result.current.fieldConfig).toEqual({
        stopDate: { isVisible: true, isMandatory: true },
        stopReason: { isVisible: true, isMandatory: true },
        note: { isVisible: true, isMandatory: false },
      });
    });
  });

  describe('setStopDate', () => {
    it('should update the stop date', () => {
      const { result } = renderHook(() => useStopMedicationStore());
      const newDate = new Date('2025-06-15');

      act(() => {
        result.current.setStopDate(newDate);
      });

      expect(result.current.stopDate).toBe(newDate);
    });

    it('should clear stopDate error when a value is set', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      // First trigger validation to produce errors
      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
        result.current.setStopDate(null as unknown as Date);
      });
      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.stopDate).toBeDefined();

      act(() => {
        result.current.setStopDate(new Date());
      });

      expect(result.current.errors.stopDate).toBeUndefined();
    });
  });

  describe('setStopReason', () => {
    it('should update the stop reason', () => {
      const { result } = renderHook(() => useStopMedicationStore());
      const reason = { uuid: 'reason-uuid-1', display: 'Adverse reaction' };

      act(() => {
        result.current.setStopReason(reason);
      });

      expect(result.current.stopReason).toEqual(reason);
    });

    it('should clear stopReason error when a value is set', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
      });
      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.stopReason).toBeDefined();

      act(() => {
        result.current.setStopReason({
          uuid: 'reason-uuid-2',
          display: 'Patient request',
        });
      });

      expect(result.current.errors.stopReason).toBeUndefined();
    });

    it('should not clear error when reason is null', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
      });
      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.stopReason).toBeDefined();

      act(() => {
        result.current.setStopReason(null);
      });

      expect(result.current.errors.stopReason).toBeDefined();
    });
  });

  describe('setNote', () => {
    it('should update the note', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setNote('Patient developed a rash');
      });

      expect(result.current.note).toBe('Patient developed a rash');
    });

    it('should clear note error when a value is set', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      // Make note mandatory, set medication, then validate
      act(() => {
        result.current.setFieldConfig({
          note: { isMandatory: true },
        });
        result.current.setMedicationToStop(mockMedicationRequest);
        result.current.setStopReason({
          uuid: 'reason-uuid-1',
          display: 'some reason',
        });
      });
      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.note).toBeDefined();

      act(() => {
        result.current.setNote('Some note');
      });

      expect(result.current.errors.note).toBeUndefined();
    });
  });

  describe('setMedicationToStop', () => {
    it('should set the medication to stop', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
      });

      expect(result.current.medicationToStop).toBe(mockMedicationRequest);
    });

    it('should allow clearing the medication', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
      });
      act(() => {
        result.current.setMedicationToStop(null);
      });

      expect(result.current.medicationToStop).toBeNull();
    });
  });

  describe('setFieldConfig', () => {
    it('should merge with default config', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setFieldConfig({
          stopReason: { isMandatory: false },
        });
      });

      expect(result.current.fieldConfig).toEqual({
        stopDate: { isVisible: true, isMandatory: true },
        stopReason: { isVisible: true, isMandatory: false },
        note: { isVisible: true, isMandatory: false },
      });
    });

    it('should override visibility', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setFieldConfig({
          note: { isVisible: false, isMandatory: false },
        });
      });

      expect(result.current.fieldConfig.note).toEqual({
        isVisible: false,
        isMandatory: false,
      });
    });
  });

  describe('validate', () => {
    it('should return true when no medication is set (nothing to validate)', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(true);
    });

    it('should return true when all mandatory fields are filled', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
        result.current.setStopReason({
          uuid: 'reason-uuid-2',
          display: 'Patient request',
        });
        result.current.setStopDate(new Date());
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('should return false and set errors when mandatory fields are missing', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
        result.current.setStopDate(null as unknown as Date);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.stopDate).toBe(
        'STOP_MEDICATION_DATE_REQUIRED',
      );
      expect(result.current.errors.stopReason).toBe(
        'STOP_MEDICATION_REASON_REQUIRED',
      );
    });

    it('should not set error for note when note is not mandatory (default)', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
        result.current.setStopReason({
          uuid: 'reason-uuid-1',
          display: 'reason',
        });
        result.current.setStopDate(new Date());
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors.note).toBeUndefined();
    });

    it('should set note error when note is mandatory and empty', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setFieldConfig({
          note: { isMandatory: true },
        });
        result.current.setMedicationToStop(mockMedicationRequest);
        result.current.setStopReason({
          uuid: 'reason-uuid-1',
          display: 'reason',
        });
        result.current.setStopDate(new Date());
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.note).toBe('STOP_MEDICATION_NOTE_REQUIRED');
    });

    it('should respect isMandatory flags — non-mandatory stopReason does not produce error', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setFieldConfig({
          stopReason: { isMandatory: false },
        });
        result.current.setMedicationToStop(mockMedicationRequest);
        result.current.setStopDate(new Date());
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors.stopReason).toBeUndefined();
    });

    it('should not validate hidden fields even if mandatory', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setFieldConfig({
          stopReason: { isVisible: false, isMandatory: true },
        });
        result.current.setMedicationToStop(mockMedicationRequest);
        result.current.setStopDate(new Date());
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      // isVisible is false, so even though isMandatory is true,
      // the code checks cfg.stopReason?.isVisible !== false
      expect(isValid!).toBe(true);
    });

    it('should use STOP_MEDICATION_*_REQUIRED error keys when isCancelVaccination is false', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
        result.current.setStopDate(null as unknown as Date);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate(false);
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.stopDate).toBe(
        'STOP_MEDICATION_DATE_REQUIRED',
      );
      expect(result.current.errors.stopReason).toBe(
        'STOP_MEDICATION_REASON_REQUIRED',
      );
    });

    it('should default to STOP_MEDICATION_*_REQUIRED error keys when isCancelVaccination is omitted', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
        result.current.setStopDate(null as unknown as Date);
      });

      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.stopDate).toBe(
        'STOP_MEDICATION_DATE_REQUIRED',
      );
    });
  });

  describe('hasData', () => {
    it('should return true when medicationToStop is set', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
      });

      expect(result.current.hasData()).toBe(true);
    });

    it('should return false when medicationToStop is null', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      expect(result.current.hasData()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all state back to defaults', () => {
      const { result } = renderHook(() => useStopMedicationStore());

      // Set everything
      act(() => {
        result.current.setMedicationToStop(mockMedicationRequest);
        result.current.setStopReason({
          uuid: 'reason-uuid-1',
          display: 'Adverse reaction',
        });
        result.current.setNote('Patient had rash');
        result.current.setFieldConfig({
          note: { isMandatory: true },
        });
      });

      act(() => {
        result.current.validate();
      });

      // Now reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.medicationToStop).toBeNull();
      expect(result.current.stopReason).toBeNull();
      expect(result.current.note).toBe('');
      expect(result.current.errors).toEqual({});
      expect(result.current.stopDate.toDateString()).toBe(
        new Date().toDateString(),
      );
      expect(result.current.fieldConfig).toEqual({
        stopDate: { isVisible: true, isMandatory: true },
        stopReason: { isVisible: true, isMandatory: true },
        note: { isVisible: true, isMandatory: false },
      });
    });
  });
});
