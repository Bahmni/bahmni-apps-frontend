import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import {
  mockAppointmentServices,
  mockCurrentUser,
  mockFHIRBundle,
  mockLocations,
  mockProviders,
} from '../__mocks__/unavailabilityMock';
import useUnavailabilityFormData from '../hook';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getCurrentUser: jest.fn(),
  getProviderLoginLocations: jest.fn(),
  getFHIRLocationsByTag: jest.fn(),
  getAllAppointmentServices: jest.fn(),
  fetchAllProviders: jest.fn(),
}));

const {
  getCurrentUser,
  getProviderLoginLocations,
  getFHIRLocationsByTag,
  getAllAppointmentServices,
  fetchAllProviders,
} = jest.requireMock('@bahmni/services');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return Wrapper;
};

describe('useUnavailabilityFormData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return data from all queries when successful', async () => {
    getCurrentUser.mockResolvedValue(mockCurrentUser);
    getProviderLoginLocations.mockResolvedValue(mockLocations);
    getAllAppointmentServices.mockResolvedValue(mockAppointmentServices);
    fetchAllProviders.mockResolvedValue(mockProviders);

    const { result } = renderHook(() => useUnavailabilityFormData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.loginLocations).toEqual(mockLocations);
    expect(result.current.services).toEqual(mockAppointmentServices);
    expect(result.current.providers).toEqual(mockProviders);
    expect(result.current.isError).toBe(false);
  });

  it('should set isLoading true and return empty arrays before data loads', () => {
    getCurrentUser.mockReturnValue(new Promise(() => {}));
    getAllAppointmentServices.mockReturnValue(new Promise(() => {}));
    fetchAllProviders.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useUnavailabilityFormData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.loginLocations).toEqual([]);
    expect(result.current.services).toEqual([]);
    expect(result.current.providers).toEqual([]);
  });

  it('should set isError true when a query fails', async () => {
    getCurrentUser.mockRejectedValue(new Error('Network error'));
    getAllAppointmentServices.mockResolvedValue(mockAppointmentServices);
    fetchAllProviders.mockResolvedValue(mockProviders);

    const { result } = renderHook(() => useUnavailabilityFormData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
  });

  it('should fall back to FHIR locations when provider has no login locations', async () => {
    getCurrentUser.mockResolvedValue(mockCurrentUser);
    getProviderLoginLocations.mockResolvedValue([]);
    getFHIRLocationsByTag.mockResolvedValue(mockFHIRBundle);
    getAllAppointmentServices.mockResolvedValue(mockAppointmentServices);
    fetchAllProviders.mockResolvedValue(mockProviders);

    const { result } = renderHook(() => useUnavailabilityFormData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getFHIRLocationsByTag).toHaveBeenCalled();
    expect(result.current.loginLocations).toEqual([
      { uuid: 'location-uuid-1', display: 'General OPD', childLocations: [] },
      { uuid: 'location-uuid-2', display: 'ENT Ward', childLocations: [] },
    ]);
  });
});
