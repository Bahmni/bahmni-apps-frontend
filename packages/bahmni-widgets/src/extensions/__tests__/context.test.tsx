import { renderHook } from '@testing-library/react';
import React from 'react';
import { ExtensionConfigContext, useExtensionConfig } from '../context';

describe('useExtensionConfig', () => {
  it('throws when used outside ExtensionConfigProvider', () => {
    expect(() => renderHook(() => useExtensionConfig())).toThrow(
      'useExtensionConfig must be used within an ExtensionConfigProvider',
    );
  });

  it('returns context value when used inside a provider', () => {
    const mockValue = {
      extensions: [],
      isLoading: false,
      error: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ExtensionConfigContext.Provider value={mockValue}>
        {children}
      </ExtensionConfigContext.Provider>
    );

    const { result } = renderHook(() => useExtensionConfig(), { wrapper });

    expect(result.current).toEqual(mockValue);
  });
});
