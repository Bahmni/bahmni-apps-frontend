import { getEncounterTypeByName } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { usePatientDocumentsConfig } from '../../providers/patientDocumentsConfig';
import { useDocumentEncounterType } from '../useDocumentEncounterType';

jest.mock('@bahmni/services', () => ({
  getEncounterTypeByName: jest.fn(),
}));
jest.mock('../../providers/patientDocumentsConfig', () => ({
  usePatientDocumentsConfig: jest.fn(),
}));

const mockedGetEncounterTypeByName =
  getEncounterTypeByName as jest.MockedFunction<typeof getEncounterTypeByName>;
const mockedUseConfig = usePatientDocumentsConfig as jest.MockedFunction<
  typeof usePatientDocumentsConfig
>;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDocumentEncounterType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves the configured encounter type name to an {uuid,name} reference', async () => {
    mockedUseConfig.mockReturnValue({
      patientDocumentsConfig: { documentEncounterTypeName: 'Patient Document' },
      isLoading: false,
      error: null,
    });
    mockedGetEncounterTypeByName.mockResolvedValue({
      uuid: 'b6f8b3e1-4c2a-4b7e-9c1d-8a2f5e6d7c90',
      name: 'Patient Document',
    });

    const { result } = renderHook(() => useDocumentEncounterType(), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.encounterType).toEqual({
        uuid: 'b6f8b3e1-4c2a-4b7e-9c1d-8a2f5e6d7c90',
        name: 'Patient Document',
      }),
    );
    expect(mockedGetEncounterTypeByName).toHaveBeenCalledWith(
      'Patient Document',
    );
  });

  it('does not resolve an encounter type when the config has no name', async () => {
    mockedUseConfig.mockReturnValue({
      patientDocumentsConfig: {} as never,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useDocumentEncounterType(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.encounterType).toBeNull();
    expect(mockedGetEncounterTypeByName).not.toHaveBeenCalled();
  });
});
