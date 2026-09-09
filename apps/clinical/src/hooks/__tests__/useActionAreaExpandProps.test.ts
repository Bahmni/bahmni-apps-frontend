import { renderHook } from '@testing-library/react';
import { useActionAreaExpandProps } from '../useActionAreaExpandProps';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('useActionAreaExpandProps', () => {
  it('returns the expand/collapse prop block with translated aria labels', () => {
    const onToggleExpand = jest.fn();
    const { result } = renderHook(() =>
      useActionAreaExpandProps({ isExpanded: true, onToggleExpand }),
    );

    expect(result.current).toEqual({
      isExpanded: true,
      onToggleExpand,
      expandAriaLabel: 'CONSULTATION_PAD_EXPAND_ARIA_LABEL',
      collapseAriaLabel: 'CONSULTATION_PAD_COLLAPSE_ARIA_LABEL',
    });
  });

  it('returns an empty object when disabled, so no second toggle is rendered', () => {
    const onToggleExpand = jest.fn();
    const { result } = renderHook(() =>
      useActionAreaExpandProps({
        isExpanded: true,
        onToggleExpand,
        disabled: true,
      }),
    );

    expect(result.current).toEqual({});
  });
});
