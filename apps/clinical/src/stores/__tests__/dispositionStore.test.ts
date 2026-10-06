import { renderHook, act } from '@testing-library/react';
import { useDispositionStore } from '../dispositionStore';

const admitType = { value: 'ADMIT', label: 'Admit' };
const transferType = { value: 'TRANSFER', label: 'Transfer' };

describe('useDispositionStore', () => {
  beforeEach(() => {
    act(() => {
      useDispositionStore.getState().reset();
    });
  });

  it('has empty initial state', () => {
    const { result } = renderHook(() => useDispositionStore());

    expect(result.current.selectedType).toBeNull();
    expect(result.current.date).toBeNull();
    expect(result.current.notes).toBe('');
    expect(result.current.errors).toEqual({});
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
