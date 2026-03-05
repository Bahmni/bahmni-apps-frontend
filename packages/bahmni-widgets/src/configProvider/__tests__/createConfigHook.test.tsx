import { renderHook } from '@testing-library/react';
import React, { createContext } from 'react';
import { createConfigHook } from '../createConfigHook';

interface TestContextValue {
  testConfig: { value: string } | undefined;
  isLoading: boolean;
  error: Error | null;
}

const TestContext = createContext<TestContextValue | undefined>(undefined);

const useTestConfig = createConfigHook<TestContextValue>(
  TestContext,
  'useTestConfig',
  'TestConfigProvider',
);

describe('createConfigHook', () => {
  it('should return the context value when inside the provider', () => {
    const mockValue: TestContextValue = {
      testConfig: { value: 'test' },
      isLoading: false,
      error: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestContext.Provider value={mockValue}>{children}</TestContext.Provider>
    );

    const { result } = renderHook(() => useTestConfig(), { wrapper });

    expect(result.current).toEqual(mockValue);
  });

  it('should throw an error when used outside the provider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTestConfig());
    }).toThrow('useTestConfig must be used within a TestConfigProvider');

    consoleError.mockRestore();
  });
});
