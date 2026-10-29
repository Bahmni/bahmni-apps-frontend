import { renderHook, act } from '@testing-library/react';
import { useDispositionStore } from '../dispositionStore';

const admitType = { value: 'ADMIT', label: 'Admit' };
const transferType = { value: 'TRANSFER', label: 'Transfer' };
const dischargeType = { value: 'DISCHARGE', label: 'Discharge' };

describe('useDispositionStore', () => {
  beforeEach(() => {
    act(() => {
      useDispositionStore.getState().setTypeRequired(true);
      useDispositionStore.getState().setHasActiveOrder('ADMIT', false);
      useDispositionStore.getState().setHasActiveOrder('DISCHARGE', false);
      useDispositionStore.getState().setHasActiveOrder('TRANSFER', false);
      useDispositionStore.getState().reset();
    });
  });

  it('has empty initial state', () => {
    const { result } = renderHook(() => useDispositionStore());

    expect(result.current.selectedType).toBeNull();
    expect(result.current.date).toBeNull();
    expect(result.current.notes).toBe('');
    expect(result.current.errors).toEqual({});
    expect(result.current.isTypeRequired).toBe(true);
    expect(result.current.activeOrderByType).toEqual({
      ADMIT: false,
      DISCHARGE: false,
      TRANSFER: false,
    });
  });

  it('reset preserves the config-driven isTypeRequired flag', () => {
    const { result } = renderHook(() => useDispositionStore());

    act(() => {
      result.current.setTypeRequired(false);
      result.current.setSelectedType(admitType);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.isTypeRequired).toBe(false);
  });

  it('setSelectedType updates the selected type and clears notes', () => {
    const { result } = renderHook(() => useDispositionStore());

    act(() => {
      result.current.setNotes('some notes');
    });
    act(() => {
      result.current.setSelectedType(admitType);
    });

    expect(result.current.selectedType).toEqual(admitType);
    expect(result.current.notes).toBe('');
  });

  it('setSelectedType clears the type error once a type is chosen', () => {
    const { result } = renderHook(() => useDispositionStore());

    act(() => {
      result.current.validate();
    });
    expect(result.current.errors.type).toBe('DROPDOWN_VALUE_REQUIRED');

    act(() => {
      result.current.setSelectedType(admitType);
    });
    expect(result.current.errors.type).toBeUndefined();
  });

  it('setSelectedType(null) clears the type', () => {
    const { result } = renderHook(() => useDispositionStore());

    act(() => {
      result.current.setSelectedType(admitType);
    });
    act(() => {
      result.current.setSelectedType(null);
    });

    expect(result.current.selectedType).toBeNull();
  });

  it('setDate updates date', () => {
    const { result } = renderHook(() => useDispositionStore());
    const date = new Date('2026-09-29');

    act(() => {
      result.current.setDate(date);
    });

    expect(result.current.date).toEqual(date);
  });

  it('setNotes updates notes', () => {
    const { result } = renderHook(() => useDispositionStore());

    act(() => {
      result.current.setNotes('follow up notes');
    });

    expect(result.current.notes).toBe('follow up notes');
  });

  describe('validate', () => {
    it('fails and sets an error when no type is selected', () => {
      const { result } = renderHook(() => useDispositionStore());

      let isValid = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.type).toBe('DROPDOWN_VALUE_REQUIRED');
    });

    it('passes when a type is selected', () => {
      const { result } = renderHook(() => useDispositionStore());

      act(() => {
        result.current.setSelectedType(transferType);
      });

      let isValid = false;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.type).toBeUndefined();
    });

    it('fails with a duplicate-order error when ADMIT is selected and an active Admit order already exists', () => {
      const { result } = renderHook(() => useDispositionStore());

      act(() => {
        result.current.setHasActiveOrder('ADMIT', true);
        result.current.setSelectedType(admitType);
      });

      let isValid = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.type).toBe(
        'DISPOSITION_ACTIVE_ADMIT_ORDER_EXISTS',
      );
    });

    it('passes for ADMIT when there is no active Admit order', () => {
      const { result } = renderHook(() => useDispositionStore());

      act(() => {
        result.current.setHasActiveOrder('ADMIT', false);
        result.current.setSelectedType(admitType);
      });

      let isValid = false;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.type).toBeUndefined();
    });

    it('fails with a duplicate-order error when DISCHARGE is selected and an active Discharge order already exists', () => {
      const { result } = renderHook(() => useDispositionStore());

      act(() => {
        result.current.setHasActiveOrder('DISCHARGE', true);
        result.current.setSelectedType(dischargeType);
      });

      let isValid = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.type).toBe(
        'DISPOSITION_ACTIVE_DISCHARGE_ORDER_EXISTS',
      );
    });

    it('passes when TRANSFER is selected even if an active Transfer order already exists', () => {
      const { result } = renderHook(() => useDispositionStore());

      act(() => {
        result.current.setHasActiveOrder('TRANSFER', true);
        result.current.setSelectedType(transferType);
      });

      let isValid = false;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.type).toBeUndefined();
    });

    it('passes without a type selected when config marks type as not required', () => {
      const { result } = renderHook(() => useDispositionStore());

      act(() => {
        result.current.setTypeRequired(false);
      });

      let isValid = false;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.type).toBeUndefined();
    });
  });

  describe('hasData', () => {
    it('returns false when nothing is selected', () => {
      const { result } = renderHook(() => useDispositionStore());
      expect(result.current.hasData()).toBe(false);
    });

    it('returns true once a type is selected', () => {
      const { result } = renderHook(() => useDispositionStore());

      act(() => {
        result.current.setSelectedType(admitType);
      });

      expect(result.current.hasData()).toBe(true);
    });
  });

  it('reset clears all fields', () => {
    const { result } = renderHook(() => useDispositionStore());

    act(() => {
      result.current.setSelectedType(admitType);
      result.current.setDate(new Date());
      result.current.setNotes('notes');
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedType).toBeNull();
    expect(result.current.date).toBeNull();
    expect(result.current.notes).toBe('');
    expect(result.current.errors).toEqual({});
  });
});
