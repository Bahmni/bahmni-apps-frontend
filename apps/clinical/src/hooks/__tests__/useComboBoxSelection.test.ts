import { renderHook, act } from '@testing-library/react';
import useComboBoxSelection from '../useComboBoxSelection';

interface TestItem {
  id: string;
  name: string;
}

describe('useComboBoxSelection', () => {
  it('should initialize with null selectedItem', () => {
    const { result } = renderHook(() => useComboBoxSelection<TestItem>());

    expect(result.current.selectedItem).toBeNull();
  });

  it('should set selectedItem and reset it via queueMicrotask', async () => {
    const { result } = renderHook(() => useComboBoxSelection<TestItem>());
    const testItem: TestItem = { id: '1', name: 'Test Item' };

    act(() => {
      result.current.resetSelection(testItem);
    });

    expect(result.current.selectedItem).toEqual(testItem);

    // Wait for microtask queue to process
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.selectedItem).toBeNull();
  });

  it('should handle multiple resetSelection calls correctly', async () => {
    const { result } = renderHook(() => useComboBoxSelection<TestItem>());
    const testItem1: TestItem = { id: '1', name: 'Item 1' };
    const testItem2: TestItem = { id: '2', name: 'Item 2' };

    act(() => {
      result.current.resetSelection(testItem1);
    });
    expect(result.current.selectedItem).toEqual(testItem1);

    act(() => {
      result.current.resetSelection(testItem2);
    });
    expect(result.current.selectedItem).toEqual(testItem2);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.selectedItem).toBeNull();
  });

  it('should work with different item types', async () => {
    const { result: stringResult } = renderHook(() =>
      useComboBoxSelection<string>(),
    );
    const { result: numberResult } = renderHook(() =>
      useComboBoxSelection<number>(),
    );

    act(() => {
      stringResult.current.resetSelection('test');
    });
    expect(stringResult.current.selectedItem).toBe('test');

    act(() => {
      numberResult.current.resetSelection(42);
    });
    expect(numberResult.current.selectedItem).toBe(42);

    await act(async () => {
      await Promise.resolve();
    });

    expect(stringResult.current.selectedItem).toBeNull();
    expect(numberResult.current.selectedItem).toBeNull();
  });

  it('should work with complex object types', async () => {
    interface ComplexItem {
      uuid: string;
      displayName: string;
      metadata?: Record<string, unknown>;
    }

    const { result } = renderHook(() => useComboBoxSelection<ComplexItem>());
    const complexItem: ComplexItem = {
      uuid: 'uuid-123',
      displayName: 'Complex Item',
      metadata: { source: 'test' },
    };

    act(() => {
      result.current.resetSelection(complexItem);
    });

    expect(result.current.selectedItem).toEqual(complexItem);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.selectedItem).toBeNull();
  });
});
