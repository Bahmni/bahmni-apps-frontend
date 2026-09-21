import { getTelecomAttributeTypeMap } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useTelecomAttributeTypeMap } from '../useTelecomAttributeTypeMap';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getTelecomAttributeTypeMap: jest.fn(),
}));

const mockGetTelecomAttributeTypeMap = getTelecomAttributeTypeMap as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
};

describe('useTelecomAttributeTypeMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the fetched mapping', async () => {
    const mapping = [{ attributeTypeUuid: 'uuid-1', system: 'phone' }];
    mockGetTelecomAttributeTypeMap.mockResolvedValue(mapping);

    const { result } = renderHook(() => useTelecomAttributeTypeMap(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.telecomAttributeTypeMap).toEqual(mapping);
  });

  it('should default to an empty array while loading', () => {
    mockGetTelecomAttributeTypeMap.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useTelecomAttributeTypeMap(), {
      wrapper: createWrapper(),
    });

    expect(result.current.telecomAttributeTypeMap).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });
});
