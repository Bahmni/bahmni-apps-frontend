import { renderHook } from '@testing-library/react';
import { usePersonAttributeFields } from '../usePersonAttributeFields';

// Mock usePersonAttributes hook
const mockUsePersonAttributes = jest.fn();

jest.mock('../usePersonAttributes', () => ({
  usePersonAttributes: () => mockUsePersonAttributes(),
}));

describe('usePersonAttributeFields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Field Transformation', () => {
    it('should transform person attributes into field format', () => {
      mockUsePersonAttributes.mockReturnValue({
        personAttributes: [
          {
            uuid: 'attr-1',
            name: 'phoneNumber',
            format: 'java.lang.String',
            sortWeight: 2,
            description: 'Phone number field',
            concept: null,
          },
          {
            uuid: 'attr-2',
            name: 'email',
            format: 'java.lang.String',
            sortWeight: 1,
            description: 'Email field',
            concept: null,
          },
        ],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.attributeFields).toHaveLength(2);
      expect(result.current.attributeFields[0]).toEqual({
        uuid: 'attr-2',
        name: 'email',
        format: 'java.lang.String',
        sortWeight: 1,
        description: 'Email field',
        answers: undefined,
      });
      expect(result.current.attributeFields[1]).toEqual({
        uuid: 'attr-1',
        name: 'phoneNumber',
        format: 'java.lang.String',
        sortWeight: 2,
        description: 'Phone number field',
        answers: undefined,
      });
    });

    it('should sort fields by sortWeight ascending', () => {
      mockUsePersonAttributes.mockReturnValue({
        personAttributes: [
          {
            uuid: 'attr-1',
            name: 'field1',
            format: 'java.lang.String',
            sortWeight: 3,
            description: null,
            concept: null,
          },
          {
            uuid: 'attr-2',
            name: 'field2',
            format: 'java.lang.String',
            sortWeight: 1,
            description: null,
            concept: null,
          },
          {
            uuid: 'attr-3',
            name: 'field3',
            format: 'java.lang.String',
            sortWeight: 2,
            description: null,
            concept: null,
          },
        ],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.attributeFields[0].name).toBe('field2');
      expect(result.current.attributeFields[1].name).toBe('field3');
      expect(result.current.attributeFields[2].name).toBe('field1');
    });

    it('should map concept answers when present', () => {
      mockUsePersonAttributes.mockReturnValue({
        personAttributes: [
          {
            uuid: 'attr-1',
            name: 'bloodGroup',
            format: 'org.openmrs.Concept',
            sortWeight: 1,
            description: 'Blood group',
            concept: {
              answers: [
                {
                  uuid: 'answer-1',
                  name: {
                    display: 'A+',
                  },
                },
                {
                  uuid: 'answer-2',
                  name: {
                    display: 'B+',
                  },
                },
                {
                  uuid: 'answer-3',
                  name: {
                    display: 'O+',
                  },
                },
              ],
            },
          },
        ],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.attributeFields[0].answers).toEqual([
        { uuid: 'answer-1', display: 'A+' },
        { uuid: 'answer-2', display: 'B+' },
        { uuid: 'answer-3', display: 'O+' },
      ]);
    });

    it('should handle attributes without concept answers', () => {
      mockUsePersonAttributes.mockReturnValue({
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
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.attributeFields[0].answers).toBeUndefined();
    });

    it('should handle attributes with empty concept answers', () => {
      mockUsePersonAttributes.mockReturnValue({
        personAttributes: [
          {
            uuid: 'attr-1',
            name: 'bloodGroup',
            format: 'org.openmrs.Concept',
            sortWeight: 1,
            description: null,
            concept: {
              answers: [],
            },
          },
        ],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.attributeFields[0].answers).toEqual([]);
    });
  });

  describe('Loading State', () => {
    it('should return loading state from context', () => {
      mockUsePersonAttributes.mockReturnValue({
        personAttributes: [],
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.isLoading).toBe(true);
    });

    it('should return not loading when data is available', () => {
      mockUsePersonAttributes.mockReturnValue({
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
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should return error state from context', () => {
      const mockError = new Error('Failed to load attributes');
      mockUsePersonAttributes.mockReturnValue({
        personAttributes: [],
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.error).toBe(mockError);
    });

    it('should return null error when no error', () => {
      mockUsePersonAttributes.mockReturnValue({
        personAttributes: [],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.error).toBeNull();
    });
  });

  describe('Empty Data', () => {
    it('should handle empty person attributes array', () => {
      mockUsePersonAttributes.mockReturnValue({
        personAttributes: [],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.attributeFields).toEqual([]);
    });

    it('should return empty array when no data', () => {
      mockUsePersonAttributes.mockReturnValue({
        personAttributes: [],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.attributeFields).toHaveLength(0);
    });
  });

  describe('Description Handling', () => {
    it('should include description when present', () => {
      mockUsePersonAttributes.mockReturnValue({
        personAttributes: [
          {
            uuid: 'attr-1',
            name: 'phoneNumber',
            format: 'java.lang.String',
            sortWeight: 1,
            description: 'Contact phone number',
            concept: null,
          },
        ],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.attributeFields[0].description).toBe(
        'Contact phone number',
      );
    });

    it('should handle null description', () => {
      mockUsePersonAttributes.mockReturnValue({
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
      });

      const { result } = renderHook(() => usePersonAttributeFields());

      expect(result.current.attributeFields[0].description).toBeNull();
    });
  });

  describe('Memoization', () => {
    it('should memoize attribute fields', () => {
      const personAttributes = [
        {
          uuid: 'attr-1',
          name: 'phoneNumber',
          format: 'java.lang.String',
          sortWeight: 1,
          description: null,
          concept: null,
        },
      ];

      mockUsePersonAttributes.mockReturnValue({
        personAttributes,
        isLoading: false,
        error: null,
      });

      const { result, rerender } = renderHook(() => usePersonAttributeFields());

      const firstResult = result.current.attributeFields;

      // Rerender with same data
      rerender();

      expect(result.current.attributeFields).toBe(firstResult);
    });

    it('should update when person attributes change', () => {
      mockUsePersonAttributes.mockReturnValue({
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
      });

      const { result, rerender } = renderHook(() => usePersonAttributeFields());

      expect(result.current.attributeFields).toHaveLength(1);

      // Update mock with new data
      mockUsePersonAttributes.mockReturnValue({
        personAttributes: [
          {
            uuid: 'attr-1',
            name: 'phoneNumber',
            format: 'java.lang.String',
            sortWeight: 1,
            description: null,
            concept: null,
          },
          {
            uuid: 'attr-2',
            name: 'email',
            format: 'java.lang.String',
            sortWeight: 2,
            description: null,
            concept: null,
          },
        ],
        isLoading: false,
        error: null,
      });

      rerender();

      expect(result.current.attributeFields).toHaveLength(2);
    });
  });
});
