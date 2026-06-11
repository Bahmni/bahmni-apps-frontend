import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useRegistrationEncounterTypeUuid } from '../useRegistrationEncounterTypeUuid';

const mockGetEncounterTypeUuidByName = jest.fn();
jest.mock('../../services/registrationEncounterService', () => ({
  getEncounterTypeUuidByName: (...args: unknown[]) =>
    mockGetEncounterTypeUuidByName(...args),
}));

const mockUseRegistrationConfig = jest.fn();
jest.mock('../../providers/registrationConfig', () => ({
  useRegistrationConfig: () => mockUseRegistrationConfig(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('useRegistrationEncounterTypeUuid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the encounter type uuid when config and lookup succeed', async () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: { registrationEncounterType: 'Registration' },
    });
    mockGetEncounterTypeUuidByName.mockResolvedValue('enc-type-uuid-123');

    const { result } = renderHook(() => useRegistrationEncounterTypeUuid(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBe('enc-type-uuid-123');
    });
    expect(mockGetEncounterTypeUuidByName).toHaveBeenCalledWith('Registration');
  });

  it('should return undefined when registrationEncounterType is not configured', async () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {},
    });

    const { result } = renderHook(() => useRegistrationEncounterTypeUuid(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
    expect(mockGetEncounterTypeUuidByName).not.toHaveBeenCalled();
  });

  it('should return undefined when registrationConfig is not yet loaded', async () => {
    mockUseRegistrationConfig.mockReturnValue({ registrationConfig: null });

    const { result } = renderHook(() => useRegistrationEncounterTypeUuid(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
    expect(mockGetEncounterTypeUuidByName).not.toHaveBeenCalled();
  });

  it('should return undefined when the encounter type name is not found in OpenMRS', async () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: { registrationEncounterType: 'Unknown Type' },
    });
    mockGetEncounterTypeUuidByName.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRegistrationEncounterTypeUuid(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });
});
