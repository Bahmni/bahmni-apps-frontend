import { fetchFormMetadata, fetchObservationForms } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useFormSchemaData } from '../useFormSchemaData';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  fetchObservationForms: jest.fn(),
  fetchFormMetadata: jest.fn(),
}));

const mockFetchObservationForms = fetchObservationForms as jest.MockedFunction<
  typeof fetchObservationForms
>;
const mockFetchFormMetadata = fetchFormMetadata as jest.MockedFunction<
  typeof fetchFormMetadata
>;

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

const vitalsForm = {
  uuid: 'form-uuid-1',
  name: 'Vitals',
  id: 1,
  privileges: [],
};

const vitalsMetadata = {
  uuid: 'form-uuid-1',
  name: 'Vitals',
  version: '1',
  published: true,
  schema: {
    controls: [
      {
        id: 100,
        type: 'section',
        label: { value: 'Vitals Section' },
        controls: [
          { id: 1, concept: { uuid: 'concept-1', datatype: 'Datetime' } },
          { id: 2 },
        ],
      },
    ],
  },
};

describe('useFormSchemaData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should derive controlOrder, sectionMap and conceptDatatypeMap from the matching form schema', async () => {
    mockFetchObservationForms.mockResolvedValue([vitalsForm]);
    mockFetchFormMetadata.mockResolvedValue(vitalsMetadata);

    const { result } = renderHook(() => useFormSchemaData('Vitals'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchFormMetadata).toHaveBeenCalledWith('form-uuid-1');
    expect(result.current.controlOrder).toEqual(['100', '1', '2']);
    expect(result.current.sectionMap).toEqual({
      '1': 'Vitals Section',
      '2': 'Vitals Section',
    });
    expect(result.current.conceptDatatypeMap).toEqual({
      'concept-1': 'Datetime',
    });
    expect(result.current.isError).toBe(false);
  });

  it('should match the form name case-insensitively', async () => {
    mockFetchObservationForms.mockResolvedValue([vitalsForm]);
    mockFetchFormMetadata.mockResolvedValue(vitalsMetadata);

    const { result } = renderHook(() => useFormSchemaData('vITALs'), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(mockFetchFormMetadata).toHaveBeenCalledWith('form-uuid-1'),
    );
    await waitFor(() => expect(result.current.controlOrder).toBeDefined());
  });

  it('should not fetch anything when no form name is provided', () => {
    const { result } = renderHook(() => useFormSchemaData(undefined), {
      wrapper: createWrapper(),
    });

    expect(mockFetchObservationForms).not.toHaveBeenCalled();
    expect(mockFetchFormMetadata).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.controlOrder).toBeUndefined();
  });

  it('should not fetch metadata when no published form matches the name', async () => {
    mockFetchObservationForms.mockResolvedValue([
      { uuid: 'other-uuid', name: 'Some Other Form', id: 2, privileges: [] },
    ]);

    const { result } = renderHook(() => useFormSchemaData('Vitals'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchFormMetadata).not.toHaveBeenCalled();
    expect(result.current.controlOrder).toBeUndefined();
    expect(result.current.isError).toBe(false);
  });

  it('should surface an error message when metadata fetch fails', async () => {
    mockFetchObservationForms.mockResolvedValue([vitalsForm]);
    mockFetchFormMetadata.mockRejectedValue(new Error('metadata boom'));

    const { result } = renderHook(() => useFormSchemaData('Vitals'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.errorMessage).toBeDefined();
    expect(result.current.controlOrder).toBeUndefined();
  });

  // A failing forms list must degrade to sortId ordering, not an error state.
  it('should not report an error when the forms list fetch fails', async () => {
    mockFetchObservationForms.mockRejectedValue(new Error('forms boom'));

    const { result } = renderHook(() => useFormSchemaData('Vitals'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.errorMessage).toBeUndefined();
    expect(mockFetchFormMetadata).not.toHaveBeenCalled();
  });
});
