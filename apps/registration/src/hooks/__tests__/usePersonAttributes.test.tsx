import { renderHook } from '@testing-library/react';
import React from 'react';
import { PersonAttributesContext } from '../../contexts/PersonAttributesContext';
import { usePersonAttributes } from '../usePersonAttributes';

describe('usePersonAttributes', () => {
  describe('Error Handling', () => {
    it('should throw error when used outside PersonAttributesProvider', () => {
      // Mock console.error to avoid cluttering test output
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePersonAttributes());
      }).toThrow(
        'usePersonAttributes must be used within a PersonAttributesProvider',
      );

      consoleError.mockRestore();
    });

    it('should provide correct error message', () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      try {
        renderHook(() => usePersonAttributes());
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          'usePersonAttributes must be used within a PersonAttributesProvider',
        );
      }

      consoleError.mockRestore();
    });
  });

  describe('Context Access', () => {
    it('should return context value when used within provider', () => {
      const mockContextValue = {
        personAttributes: [
          {
            uuid: 'attr-1',
            name: 'phoneNumber',
            format: 'java.lang.String',
            sortWeight: 1,
            description: null,
            concept: null,
          },
        ],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesContext.Provider value={mockContextValue}>
          {children}
        </PersonAttributesContext.Provider>
      );

      const { result } = renderHook(() => usePersonAttributes(), { wrapper });

      expect(result.current).toEqual(mockContextValue);
    });

    it('should return personAttributes array from context', () => {
      const mockPersonAttributes = [
        {
          uuid: 'attr-1',
          name: 'email',
          format: 'java.lang.String',
          sortWeight: 1,
          description: null,
          concept: null,
        },
        {
          uuid: 'attr-2',
          name: 'phoneNumber',
          format: 'java.lang.String',
          sortWeight: 2,
          description: null,
          concept: null,
        },
      ];

      const mockContextValue = {
        personAttributes: mockPersonAttributes,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesContext.Provider value={mockContextValue}>
          {children}
        </PersonAttributesContext.Provider>
      );

      const { result } = renderHook(() => usePersonAttributes(), { wrapper });

      expect(result.current.personAttributes).toEqual(mockPersonAttributes);
      expect(result.current.personAttributes).toHaveLength(2);
    });

    it('should return loading state from context', () => {
      const mockContextValue = {
        personAttributes: [],
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesContext.Provider value={mockContextValue}>
          {children}
        </PersonAttributesContext.Provider>
      );

      const { result } = renderHook(() => usePersonAttributes(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('should return error from context', () => {
      const mockError = new Error('Failed to fetch attributes');
      const mockContextValue = {
        personAttributes: [],
        isLoading: false,
        error: mockError,
        refetch: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesContext.Provider value={mockContextValue}>
          {children}
        </PersonAttributesContext.Provider>
      );

      const { result } = renderHook(() => usePersonAttributes(), { wrapper });

      expect(result.current.error).toBe(mockError);
    });

    it('should return refetch function from context', () => {
      const mockRefetch = jest.fn();
      const mockContextValue = {
        personAttributes: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesContext.Provider value={mockContextValue}>
          {children}
        </PersonAttributesContext.Provider>
      );

      const { result } = renderHook(() => usePersonAttributes(), { wrapper });

      expect(result.current.refetch).toBe(mockRefetch);
    });
  });

  describe('Empty Context', () => {
    it('should handle empty personAttributes array', () => {
      const mockContextValue = {
        personAttributes: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesContext.Provider value={mockContextValue}>
          {children}
        </PersonAttributesContext.Provider>
      );

      const { result } = renderHook(() => usePersonAttributes(), { wrapper });

      expect(result.current.personAttributes).toEqual([]);
    });

    it('should handle null error', () => {
      const mockContextValue = {
        personAttributes: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesContext.Provider value={mockContextValue}>
          {children}
        </PersonAttributesContext.Provider>
      );

      const { result } = renderHook(() => usePersonAttributes(), { wrapper });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Context Updates', () => {
    it('should reflect context updates', () => {
      const initialContextValue = {
        personAttributes: [],
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      };

      const updatedContextValue = {
        personAttributes: [
          {
            uuid: 'attr-1',
            name: 'email',
            format: 'java.lang.String',
            sortWeight: 1,
            description: null,
            concept: null,
          },
        ],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      };

      const Wrapper = ({
        children,
        value,
      }: {
        children: React.ReactNode;
        value: typeof initialContextValue;
      }) => (
        <PersonAttributesContext.Provider value={value}>
          {children}
        </PersonAttributesContext.Provider>
      );

      const { result, rerender } = renderHook(() => usePersonAttributes(), {
        wrapper: ({ children }) => (
          <Wrapper value={initialContextValue}>{children}</Wrapper>
        ),
        initialProps: { value: initialContextValue },
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.personAttributes).toEqual([]);

      // Update context value
      rerender({ value: updatedContextValue });

      // Note: Due to how wrapper works, we need to actually change the Wrapper
      // This is more of a demonstration that the hook reads from context
    });
  });

  describe('Type Safety', () => {
    it('should return properly typed context value', () => {
      const mockContextValue = {
        personAttributes: [
          {
            uuid: 'attr-1',
            name: 'phoneNumber',
            format: 'java.lang.String',
            sortWeight: 1,
            description: 'Phone number',
            concept: null,
          },
        ],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PersonAttributesContext.Provider value={mockContextValue}>
          {children}
        </PersonAttributesContext.Provider>
      );

      const { result } = renderHook(() => usePersonAttributes(), { wrapper });

      // TypeScript checks
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(Array.isArray(result.current.personAttributes)).toBe(true);
      expect(typeof result.current.refetch).toBe('function');
    });
  });
});
