import { getConceptUuidByName } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';

import { useConcept } from '../useConcept';

jest.mock('@bahmni/services');

const mockGetConceptUuidByName = getConceptUuidByName as jest.MockedFunction<
  typeof getConceptUuidByName
>;

describe('useConcept', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
    };
  };

  describe('getConceptUuids', () => {
    it('should fetch and return UUIDs for concept names', async () => {
      mockGetConceptUuidByName
        .mockResolvedValueOnce('uuid-1')
        .mockResolvedValueOnce('uuid-2');

      const { result } = renderHook(() => useConcept(), {
        wrapper: createWrapper(),
      });

      const uuids = await result.current.getConceptUuids([
        'Temperature',
        'Blood Pressure',
      ]);

      expect(uuids).toEqual(['uuid-1', 'uuid-2']);
      expect(mockGetConceptUuidByName).toHaveBeenCalledTimes(2);
      expect(mockGetConceptUuidByName).toHaveBeenCalledWith('Temperature');
      expect(mockGetConceptUuidByName).toHaveBeenCalledWith('Blood Pressure');
    });

    it('should return cached UUIDs without fetching', async () => {
      // Pre-populate cache
      queryClient.setQueryData(
        ['concept-uuid', 'Temperature'],
        'cached-uuid-1',
      );
      queryClient.setQueryData(
        ['concept-uuid', 'Blood Pressure'],
        'cached-uuid-2',
      );

      const { result } = renderHook(() => useConcept(), {
        wrapper: createWrapper(),
      });

      const uuids = await result.current.getConceptUuids([
        'Temperature',
        'Blood Pressure',
      ]);

      expect(uuids).toEqual(['cached-uuid-1', 'cached-uuid-2']);
      expect(mockGetConceptUuidByName).not.toHaveBeenCalled();
    });

    it('should handle mix of cached and uncached concept names', async () => {
      // Pre-populate cache for one concept
      queryClient.setQueryData(['concept-uuid', 'Temperature'], 'cached-uuid');
      mockGetConceptUuidByName.mockResolvedValueOnce('fetched-uuid');

      const { result } = renderHook(() => useConcept(), {
        wrapper: createWrapper(),
      });

      const uuids = await result.current.getConceptUuids([
        'Temperature',
        'Blood Pressure',
      ]);

      expect(uuids).toEqual(['cached-uuid', 'fetched-uuid']);
      expect(mockGetConceptUuidByName).toHaveBeenCalledTimes(1);
      expect(mockGetConceptUuidByName).toHaveBeenCalledWith('Blood Pressure');
    });

    it('should filter out null UUIDs', async () => {
      mockGetConceptUuidByName
        .mockResolvedValueOnce('uuid-1')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('uuid-3');

      const { result } = renderHook(() => useConcept(), {
        wrapper: createWrapper(),
      });

      const uuids = await result.current.getConceptUuids([
        'Temperature',
        'Invalid Concept',
        'Blood Pressure',
      ]);

      expect(uuids).toEqual(['uuid-1', 'uuid-3']);
    });

    it('should handle empty concept names array', async () => {
      const { result } = renderHook(() => useConcept(), {
        wrapper: createWrapper(),
      });

      const uuids = await result.current.getConceptUuids([]);

      expect(uuids).toEqual([]);
      expect(mockGetConceptUuidByName).not.toHaveBeenCalled();
    });

    it('should cache fetched UUIDs with infinite staleTime', async () => {
      mockGetConceptUuidByName.mockResolvedValueOnce('uuid-1');

      const { result } = renderHook(() => useConcept(), {
        wrapper: createWrapper(),
      });

      // First call - should fetch
      await result.current.getConceptUuids(['Temperature']);

      // Second call - should use cache
      mockGetConceptUuidByName.mockClear();
      const uuids = await result.current.getConceptUuids(['Temperature']);

      expect(uuids).toEqual(['uuid-1']);
      expect(mockGetConceptUuidByName).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockGetConceptUuidByName.mockRejectedValueOnce(new Error('API error'));

      const { result } = renderHook(() => useConcept(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.getConceptUuids(['Temperature']),
      ).rejects.toThrow('API error');
    });

    it('should handle all concepts returning null', async () => {
      mockGetConceptUuidByName
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => useConcept(), {
        wrapper: createWrapper(),
      });

      const uuids = await result.current.getConceptUuids([
        'Invalid1',
        'Invalid2',
      ]);

      expect(uuids).toEqual([]);
    });

    it('should maintain stable reference for getConceptUuids', () => {
      const { result, rerender } = renderHook(() => useConcept(), {
        wrapper: createWrapper(),
      });

      const firstReference = result.current.getConceptUuids;
      rerender();
      const secondReference = result.current.getConceptUuids;

      expect(firstReference).toBe(secondReference);
    });
  });
});
