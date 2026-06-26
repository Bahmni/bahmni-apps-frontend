import { renderHook } from '@testing-library/react';
import React from 'react';
import { SearchWidgetConfigContext, useSearchWidgetConfig } from '../context';

describe('useSearchWidgetConfig', () => {
  it('throws when used outside SearchWidgetConfigProvider', () => {
    expect(() => renderHook(() => useSearchWidgetConfig())).toThrow(
      'useSearchWidgetConfig must be used within a SearchWidgetConfigProvider',
    );
  });

  it('returns context value when used inside a provider', () => {
    const mockValue = {
      searchWidgetConfig: { handler: 'test' },
      isLoading: false,
      error: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SearchWidgetConfigContext.Provider value={mockValue}>
        {children}
      </SearchWidgetConfigContext.Provider>
    );

    const { result } = renderHook(() => useSearchWidgetConfig(), { wrapper });

    expect(result.current).toEqual(mockValue);
  });
});
