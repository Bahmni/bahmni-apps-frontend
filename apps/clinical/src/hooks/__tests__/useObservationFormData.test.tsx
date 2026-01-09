import { FormData, FormMetadata, Form2Observation } from '@bahmni/services';
import * as bahmniServices from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useObservationFormData } from '../useObservationFormData';

// Mock the bahmni services
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  transformFormDataToObservations: jest.fn(() => []),
  fetchFormMetadata: jest.fn(),
}));

const mockFetchFormMetadata =
  bahmniServices.fetchFormMetadata as jest.MockedFunction<
    typeof bahmniServices.fetchFormMetadata
  >;

describe('useObservationFormData', () => {
  let queryClient: QueryClient;

  const mockFormMetadata: FormMetadata = {
    uuid: 'form-uuid',
    name: 'Test Form',
    version: '1.0',
    published: false,
    schema: undefined,
  };

  const mockFormData: FormData = {
    controls: [
      {
        id: 'field-1',
        conceptUuid: 'concept-1',
        type: 'obsControl',
        value: 'Test Value',
      },
    ],
    metadata: {},
  };

  const mockObservations: Form2Observation[] = [
    {
      concept: {
        uuid: 'concept-1',
        datatype: 'Text',
      },
      value: 'Test Value',
    },
  ];

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
          gcTime: Infinity,
        },
      },
    });

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = 'QueryClientWrapper';
    return Wrapper;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (
      bahmniServices.transformFormDataToObservations as jest.Mock
    ).mockReturnValue([]);
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe('Initial State', () => {
    it('should initialize with null form data when no initial data provided', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      expect(result.current.formData).toBeNull();
      expect(result.current.observations).toEqual([]);
      expect(result.current.formMetadata).toBeUndefined();
      expect(result.current.isLoadingMetadata).toBe(false);
      expect(result.current.metadataError).toBeNull();
    });

    it('should initialize with provided initial form data', () => {
      const { result } = renderHook(
        () =>
          useObservationFormData({
            initialFormData: mockFormData,
            formMetadata: mockFormMetadata,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.formData).toEqual(mockFormData);
      expect(result.current.formMetadata).toEqual(mockFormMetadata);
    });

    it('should initialize with null when initial data is null', () => {
      const { result } = renderHook(
        () =>
          useObservationFormData({
            initialFormData: null,
            formMetadata: mockFormMetadata,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.formData).toBeNull();
    });
  });

  describe('handleFormDataChange', () => {
    it('should set form data to null when data is falsy', () => {
      const { result } = renderHook(
        () =>
          useObservationFormData({
            initialFormData: mockFormData,
            formMetadata: mockFormMetadata,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.handleFormDataChange(null);
      });

      expect(result.current.formData).toBeNull();
    });

    it('should handle FormData object directly', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleFormDataChange(mockFormData);
      });

      expect(result.current.formData).toEqual(mockFormData);
    });

    it('should handle array of controls', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      const controls = [
        {
          id: 'field-1',
          conceptUuid: 'concept-1',
          type: 'obsControl' as const,
          value: 'Test Value',
        },
      ];

      act(() => {
        result.current.handleFormDataChange(controls);
      });

      expect(result.current.formData).toEqual({
        controls,
        metadata: {},
      });
    });

    it('should handle Immutable.js data with toJS method', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      const immutableData = {
        toJS: jest.fn(() => mockFormData),
      };

      act(() => {
        result.current.handleFormDataChange(immutableData);
      });

      expect(immutableData.toJS).toHaveBeenCalled();
      expect(result.current.formData).toEqual(mockFormData);
    });

    it('should extract controls from FormControlTree structure', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      const formControlTree = {
        formFieldPath: 'root',
        children: [
          {
            control: {
              concept: { uuid: 'concept-1', name: 'Test Concept' },
              type: 'obsControl',
            },
            formFieldPath: 'field-1',
            value: { value: 'Test Value' },
            voided: false,
          },
        ],
      };

      act(() => {
        result.current.handleFormDataChange(formControlTree);
      });

      expect(result.current.formData).toBeDefined();
      expect(result.current.formData?.controls).toHaveLength(1);
      expect(result.current.formData?.controls[0]).toMatchObject({
        id: 'field-1',
        conceptUuid: 'concept-1',
        type: 'obsControl',
        value: 'Test Value',
      });
    });

    it('should skip voided controls', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      const formControlTree = {
        formFieldPath: 'root',
        children: [
          {
            control: {
              concept: { uuid: 'concept-1', name: 'Test Concept' },
              type: 'obsControl',
            },
            formFieldPath: 'field-1',
            value: { value: 'Test Value' },
            voided: true,
          },
        ],
      };

      act(() => {
        result.current.handleFormDataChange(formControlTree);
      });

      expect(result.current.formData?.controls).toHaveLength(0);
    });

    it('should skip controls without conceptUuid', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      const formControlTree = {
        formFieldPath: 'root',
        children: [
          {
            control: {
              concept: { uuid: '', name: 'Test Concept' },
              type: 'obsControl',
            },
            formFieldPath: 'field-1',
            value: { value: 'Test Value' },
          },
        ],
      };

      act(() => {
        result.current.handleFormDataChange(formControlTree);
      });

      expect(result.current.formData?.controls).toHaveLength(0);
    });

    it('should skip controls without formFieldPath', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      const formControlTree = {
        formFieldPath: 'root',
        children: [
          {
            control: {
              concept: { uuid: 'concept-1', name: 'Test Concept' },
              type: 'obsControl',
            },
            formFieldPath: '',
            value: { value: 'Test Value' },
          },
        ],
      };

      act(() => {
        result.current.handleFormDataChange(formControlTree);
      });

      expect(result.current.formData?.controls).toHaveLength(0);
    });

    it('should skip controls with null, undefined, or empty string values', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      const formControlTree = {
        formFieldPath: 'root',
        children: [
          {
            control: {
              concept: { uuid: 'concept-1', name: 'Test Concept' },
              type: 'obsControl',
            },
            formFieldPath: 'field-1',
            value: { value: null },
          },
          {
            control: {
              concept: { uuid: 'concept-2', name: 'Test Concept 2' },
              type: 'obsControl',
            },
            formFieldPath: 'field-2',
            value: { value: undefined },
          },
          {
            control: {
              concept: { uuid: 'concept-3', name: 'Test Concept 3' },
              type: 'obsControl',
            },
            formFieldPath: 'field-3',
            value: { value: '' },
          },
        ],
      };

      act(() => {
        result.current.handleFormDataChange(formControlTree);
      });

      expect(result.current.formData?.controls).toHaveLength(0);
    });

    it('should handle obsGroupControl with children', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      const formControlTree = {
        formFieldPath: 'root',
        children: [
          {
            control: {
              concept: { uuid: 'group-concept', name: 'Group' },
              type: 'obsGroupControl',
            },
            formFieldPath: 'group-1',
            children: [
              {
                control: {
                  concept: { uuid: 'child-concept', name: 'Child' },
                  type: 'obsControl',
                },
                formFieldPath: 'child-1',
                value: { value: 'Child Value' },
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.handleFormDataChange(formControlTree);
      });

      expect(result.current.formData?.controls).toHaveLength(1);
      expect(result.current.formData?.controls[0]).toMatchObject({
        id: 'group-1',
        conceptUuid: 'group-concept',
        type: 'obsControl',
        value: null,
      });
      expect(result.current.formData?.controls[0].groupMembers).toHaveLength(1);
    });

    it('should skip obsGroupControl with no children', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      const formControlTree = {
        formFieldPath: 'root',
        children: [
          {
            control: {
              concept: { uuid: 'group-concept', name: 'Group' },
              type: 'obsGroupControl',
            },
            formFieldPath: 'group-1',
            children: [],
          },
        ],
      };

      act(() => {
        result.current.handleFormDataChange(formControlTree);
      });

      expect(result.current.formData?.controls).toHaveLength(0);
    });

    it('should handle multiselect controls (array values)', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      const formControlTree = {
        formFieldPath: 'root',
        children: [
          {
            control: {
              concept: { uuid: 'concept-1', name: 'Multiselect' },
              type: 'obsControl',
            },
            formFieldPath: 'field-1',
            value: { value: ['option1', 'option2'] },
          },
        ],
      };

      act(() => {
        result.current.handleFormDataChange(formControlTree);
      });

      expect(result.current.formData?.controls[0].type).toBe('multiselect');
      expect(result.current.formData?.controls[0].value).toEqual([
        'option1',
        'option2',
      ]);
    });

    it('should include interpretation when present', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      const formControlTree = {
        formFieldPath: 'root',
        children: [
          {
            control: {
              concept: { uuid: 'concept-1', name: 'Test Concept' },
              type: 'obsControl',
            },
            formFieldPath: 'field-1',
            value: { value: '120', interpretation: 'ABNORMAL' },
          },
        ],
      };

      act(() => {
        result.current.handleFormDataChange(formControlTree);
      });

      expect(result.current.formData?.controls[0].interpretation).toBe(
        'ABNORMAL',
      );
    });
  });

  describe('resetForm', () => {
    it('should clear form data', () => {
      const { result } = renderHook(
        () =>
          useObservationFormData({
            initialFormData: mockFormData,
            formMetadata: mockFormMetadata,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData).toBeNull();
    });
  });

  describe('observations', () => {
    it('should return empty array when form data is null', () => {
      const { result } = renderHook(
        () =>
          useObservationFormData({
            formMetadata: mockFormMetadata,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.observations).toEqual([]);
    });

    it('should return empty array when formMetadata is not provided', () => {
      const { result } = renderHook(
        () =>
          useObservationFormData({
            initialFormData: mockFormData,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.observations).toEqual([]);
    });

    it('should transform form data to observations when formData and formMetadata exist', () => {
      (
        bahmniServices.transformFormDataToObservations as jest.Mock
      ).mockReturnValue(mockObservations);

      const { result } = renderHook(
        () =>
          useObservationFormData({
            initialFormData: mockFormData,
            formMetadata: mockFormMetadata,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.observations).toEqual(mockObservations);
      expect(
        bahmniServices.transformFormDataToObservations,
      ).toHaveBeenCalledWith(mockFormData, mockFormMetadata);
    });

    it('should update observations when form data changes', () => {
      (
        bahmniServices.transformFormDataToObservations as jest.Mock
      ).mockReturnValue(mockObservations);

      const { result } = renderHook(
        () =>
          useObservationFormData({
            formMetadata: mockFormMetadata,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.observations).toEqual([]);

      act(() => {
        result.current.handleFormDataChange(mockFormData);
      });

      expect(result.current.observations).toEqual(mockObservations);
    });
  });

  describe('Metadata Fetching (consolidated from useObservationFormMetadata)', () => {
    it('should fetch form metadata when formUuid is provided', async () => {
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const { result } = renderHook(
        () => useObservationFormData({ formUuid: 'form-uuid' }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isLoadingMetadata).toBe(true);
      expect(result.current.formMetadata).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isLoadingMetadata).toBe(false);
      });

      expect(result.current.formMetadata).toEqual(mockFormMetadata);
      expect(result.current.metadataError).toBeNull();
      expect(mockFetchFormMetadata).toHaveBeenCalledWith('form-uuid');
      expect(mockFetchFormMetadata).toHaveBeenCalledTimes(1);
    });

    it('should not fetch when formUuid is undefined', () => {
      const { result } = renderHook(() => useObservationFormData(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoadingMetadata).toBe(false);
      expect(result.current.formMetadata).toBeUndefined();
      expect(mockFetchFormMetadata).not.toHaveBeenCalled();
    });

    it('should use provided formMetadata instead of fetching', () => {
      const { result } = renderHook(
        () =>
          useObservationFormData({
            formMetadata: mockFormMetadata,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.formMetadata).toEqual(mockFormMetadata);
      expect(result.current.isLoadingMetadata).toBe(false);
      expect(mockFetchFormMetadata).not.toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch form metadata');
      mockFetchFormMetadata.mockRejectedValue(error);

      const { result } = renderHook(
        () => useObservationFormData({ formUuid: 'form-uuid' }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoadingMetadata).toBe(false);
      });

      expect(result.current.metadataError).toBeDefined();
      expect(result.current.formMetadata).toBeUndefined();
    });

    it('should cache metadata for the same formUuid', async () => {
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const { result: result1 } = renderHook(
        () => useObservationFormData({ formUuid: 'form-uuid' }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result1.current.formMetadata).toEqual(mockFormMetadata);
      });

      expect(mockFetchFormMetadata).toHaveBeenCalledTimes(1);

      // Second render with same formUuid should use cache
      const { result: result2 } = renderHook(
        () => useObservationFormData({ formUuid: 'form-uuid' }),
        {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          ),
        },
      );

      await waitFor(() => {
        expect(result2.current.formMetadata).toEqual(mockFormMetadata);
      });

      // Should still only have been called once (using cache)
      expect(mockFetchFormMetadata).toHaveBeenCalledTimes(1);
    });

    it('should prefer provided formMetadata over fetched metadata', async () => {
      const providedMetadata: FormMetadata = {
        ...mockFormMetadata,
        name: 'Provided Form',
      };
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const { result } = renderHook(
        () =>
          useObservationFormData({
            formUuid: 'form-uuid',
            formMetadata: providedMetadata,
          }),
        { wrapper: createWrapper() },
      );

      // Should use provided metadata immediately without fetching
      expect(result.current.formMetadata).toEqual(providedMetadata);
    });
  });
});
