import { renderHook } from '@testing-library/react';
import { MedicationRequest } from 'fhir/r4';
import { act } from 'react';
import { useCancelVaccinationStore } from '../cancelVaccinationStore';

const mockMedicationRequest: MedicationRequest = {
  resourceType: 'MedicationRequest',
  id: 'med-req-1',
  status: 'active',
  intent: 'order',
  subject: { reference: 'Patient/patient-uuid-1' },
  medicationReference: {
    reference: 'Medication/med-1',
    display: 'BCG Vaccine',
  },
  encounter: { reference: 'Encounter/enc-uuid-1' },
};

describe('useCancelVaccinationStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCancelVaccinationStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial state', () => {
    it('should have default fieldConfig', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());
      expect(result.current.fieldConfig).toEqual({
        cancellationReason: { isVisible: true, isMandatory: true },
        note: { isVisible: true, isMandatory: false },
      });
    });
  });

  describe('setCancellationReason', () => {
    it('should update the cancellation reason', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setCancellationReason('Adverse reaction');
      });

      expect(result.current.cancellationReason).toBe('Adverse reaction');
    });

    it('should clear cancellationReason error when a value is set', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setFieldConfig({
          cancellationReason: { isMandatory: true },
        });
        result.current.setMedicationToCancel(mockMedicationRequest);
      });
      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.cancellationReason).toBeDefined();

      act(() => {
        result.current.setCancellationReason('Patient request');
      });

      expect(result.current.errors.cancellationReason).toBeUndefined();
    });

    it('should not clear error when reason is null', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setFieldConfig({
          cancellationReason: { isMandatory: true },
        });
        result.current.setMedicationToCancel(mockMedicationRequest);
      });
      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.cancellationReason).toBeDefined();

      act(() => {
        result.current.setCancellationReason(null);
      });

      expect(result.current.errors.cancellationReason).toBeDefined();
    });
  });

  describe('setNote', () => {
    it('should update the note', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setNote('Patient developed a rash');
      });

      expect(result.current.note).toBe('Patient developed a rash');
    });

    it('should clear note error when a value is set', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setFieldConfig({
          note: { isMandatory: true },
        });
        result.current.setMedicationToCancel(mockMedicationRequest);
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

    it('should not clear note error when note is set to an empty string', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setFieldConfig({
          note: { isMandatory: true },
        });
        result.current.setMedicationToCancel(mockMedicationRequest);
      });
      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.note).toBeDefined();

      act(() => {
        result.current.setNote('');
      });

      expect(result.current.errors.note).toBeDefined();
    });
  });

  describe('setMedicationToCancel', () => {
    it('should set the medication to cancel', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setMedicationToCancel(mockMedicationRequest);
      });

      expect(result.current.medicationToCancel).toBe(mockMedicationRequest);
    });

    it('should allow clearing the medication', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setMedicationToCancel(mockMedicationRequest);
      });
      act(() => {
        result.current.setMedicationToCancel(null);
      });

      expect(result.current.medicationToCancel).toBeNull();
    });
  });

  describe('setFieldConfig', () => {
    it('should merge with default config', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setFieldConfig({
          cancellationReason: { isMandatory: true },
        });
      });

      expect(result.current.fieldConfig).toEqual({
        cancellationReason: { isVisible: true, isMandatory: true },
        note: { isVisible: true, isMandatory: false },
      });
    });

    it('should override visibility', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

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
      const { result } = renderHook(() => useCancelVaccinationStore());

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(true);
    });

    it('should set cancellationReason error when mandatory and empty', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setFieldConfig({
          cancellationReason: { isMandatory: true },
        });
        result.current.setMedicationToCancel(mockMedicationRequest);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.cancellationReason).toBe(
        'CANCEL_VACCINATION_REASON_REQUIRED',
      );
    });

    it('should not set cancellationReason error when mandatory and already set', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setFieldConfig({
          cancellationReason: { isMandatory: true },
        });
        result.current.setMedicationToCancel(mockMedicationRequest);
        result.current.setCancellationReason('Adverse reaction');
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors.cancellationReason).toBeUndefined();
    });

    it('should set note error when mandatory and empty', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setFieldConfig({
          note: { isMandatory: true },
        });
        result.current.setMedicationToCancel(mockMedicationRequest);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.note).toBe(
        'CANCEL_VACCINATION_NOTE_REQUIRED',
      );
    });

    it('should not validate hidden fields even if mandatory', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setFieldConfig({
          cancellationReason: { isVisible: false, isMandatory: true },
        });
        result.current.setMedicationToCancel(mockMedicationRequest);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(true);
    });
  });

  describe('hasData', () => {
    it('should return true when medicationToCancel is set', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setMedicationToCancel(mockMedicationRequest);
      });

      expect(result.current.hasData()).toBe(true);
    });

    it('should return false when medicationToCancel is null', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      expect(result.current.hasData()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all state back to defaults', () => {
      const { result } = renderHook(() => useCancelVaccinationStore());

      act(() => {
        result.current.setMedicationToCancel(mockMedicationRequest);
        result.current.setCancellationReason('Adverse reaction');
        result.current.setNote('Patient had rash');
        result.current.setFieldConfig({
          note: { isMandatory: true },
        });
      });

      act(() => {
        result.current.validate();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.medicationToCancel).toBeNull();
      expect(result.current.cancellationReason).toBeNull();
      expect(result.current.note).toBe('');
      expect(result.current.errors).toEqual({});
      expect(result.current.fieldConfig).toEqual({
        cancellationReason: { isVisible: true, isMandatory: true },
        note: { isVisible: true, isMandatory: false },
      });
    });
  });
});
