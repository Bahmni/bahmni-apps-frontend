import { notificationService, PersonAttributeType } from '@bahmni/services';
import { renderHook, act } from '@testing-library/react';
import React, { useContext } from 'react';
import { PersonAttributesContext } from '../../contexts/PersonAttributesContext';
import { PersonAttributesProvider } from '../PersonAttributesProvider';

jest.mock('@bahmni/services', () => ({
  getPersonAttributeTypes: jest.fn(),
  getFormattedError: jest.fn((err: unknown) => ({
    title: 'Error',
    message: String(err),
  })),
  notificationService: {
    showError: jest.fn(),
  },
}));

const mockQueryRefetch = jest.fn();
let mockQueryReturn: {
  data: PersonAttributeType[] | undefined;
  isLoading: boolean;
  error: unknown;
  refetch: jest.Mock;
};

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => mockQueryReturn,
}));

const useTestContext = () => {
  const ctx = useContext(PersonAttributesContext);
  if (!ctx) throw new Error('No context');
  return ctx;
};

describe('PersonAttributesProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryReturn = {
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockQueryRefetch,
    };
  });

  describe('with initialAttributes', () => {
    const initialAttrs: PersonAttributeType[] = [
      {
        uuid: 'attr-1',
        name: 'phone',
        description: '',
        format: 'java.lang.String',
        sortWeight: 1,
        concept: null,
      },
    ];

    it('should use initialAttributes and set isLoading to false', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesProvider initialAttributes={initialAttrs}>
          {children}
        </PersonAttributesProvider>
      );

      const { result } = renderHook(() => useTestContext(), { wrapper });

      expect(result.current.personAttributes).toEqual(initialAttrs);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('without initialAttributes', () => {
    it('should use query data when loaded', () => {
      const queryAttrs: PersonAttributeType[] = [
        {
          uuid: 'attr-2',
          name: 'email',
          description: '',
          format: 'java.lang.String',
          sortWeight: 2,
          concept: null,
        },
      ];
      mockQueryReturn = {
        data: queryAttrs,
        isLoading: false,
        error: null,
        refetch: mockQueryRefetch,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesProvider>{children}</PersonAttributesProvider>
      );

      const { result } = renderHook(() => useTestContext(), { wrapper });

      expect(result.current.personAttributes).toEqual(queryAttrs);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to true when query is loading', () => {
      mockQueryReturn = {
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockQueryRefetch,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesProvider>{children}</PersonAttributesProvider>
      );

      const { result } = renderHook(() => useTestContext(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should preserve Error instance in context', () => {
      const error = new Error('fetch failed');
      mockQueryReturn = {
        data: undefined,
        isLoading: false,
        error,
        refetch: mockQueryRefetch,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesProvider>{children}</PersonAttributesProvider>
      );

      const { result } = renderHook(() => useTestContext(), { wrapper });

      expect(result.current.error).toBe(error);
    });

    it('should wrap non-Error values in Error', () => {
      mockQueryReturn = {
        data: undefined,
        isLoading: false,
        error: 'string error',
        refetch: mockQueryRefetch,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesProvider>{children}</PersonAttributesProvider>
      );

      const { result } = renderHook(() => useTestContext(), { wrapper });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('string error');
    });

    it('should set error to null when no query error', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesProvider>{children}</PersonAttributesProvider>
      );

      const { result } = renderHook(() => useTestContext(), { wrapper });

      expect(result.current.error).toBeNull();
    });

    it('should show error notification when query fails', () => {
      mockQueryReturn = {
        data: undefined,
        isLoading: false,
        error: new Error('API error'),
        refetch: mockQueryRefetch,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesProvider>{children}</PersonAttributesProvider>
      );

      renderHook(() => useTestContext(), { wrapper });

      expect(notificationService.showError).toHaveBeenCalled();
    });
  });

  describe('refetch stability', () => {
    it('should return stable refetch reference across re-renders', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesProvider>{children}</PersonAttributesProvider>
      );

      const { result, rerender } = renderHook(() => useTestContext(), {
        wrapper,
      });
      const firstRef = result.current.refetch;

      rerender();

      expect(result.current.refetch).toBe(firstRef);
    });

    it('should call queryRefetch when refetch is invoked', async () => {
      mockQueryRefetch.mockResolvedValue(undefined);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesProvider>{children}</PersonAttributesProvider>
      );

      const { result } = renderHook(() => useTestContext(), { wrapper });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockQueryRefetch).toHaveBeenCalled();
    });
  });
});
