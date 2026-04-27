import {
  getUserLoginLocation,
  getAvailableLocations,
  getCurrentUser,
  saveUserLocation,
  setCookie,
} from '@bahmni/services';
import { renderHook, act } from '@testing-library/react';
import { useLocation } from '../LocationContext';
import { LocationProvider } from '../LocationProvider';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getUserLoginLocation: jest.fn(),
  getAvailableLocations: jest.fn(),
  getCurrentUser: jest.fn(),
  saveUserLocation: jest.fn(),
  setCookie: jest.fn(),
  notificationService: {
    showWarning: jest.fn(),
  },
}));

const mockGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;
const mockGetAvailableLocations = getAvailableLocations as jest.MockedFunction<
  typeof getAvailableLocations
>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockSaveUserLocation = saveUserLocation as jest.MockedFunction<
  typeof saveUserLocation
>;
const mockSetCookie = setCookie as jest.MockedFunction<typeof setCookie>;

describe('LocationProvider - Persistence', () => {
  const mockLocation = {
    name: 'General Ward',
    uuid: 'location-uuid-123',
  };

  const newLocation = {
    name: 'ICU Ward',
    uuid: 'location-uuid-456',
  };

  const mockLocations = [mockLocation, newLocation];

  const mockUser = {
    uuid: 'user-uuid-789',
    username: 'testuser',
    display: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserLoginLocation.mockReturnValue(mockLocation);
    mockGetAvailableLocations.mockResolvedValue(mockLocations);
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockSaveUserLocation.mockResolvedValue(undefined);
    mockSetCookie.mockImplementation(() => {});
  });

  it('writes cookie when location is changed', async () => {
    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setLocation(newLocation);
    });

    expect(mockSetCookie).toHaveBeenCalledWith(
      'bahmni.user.location',
      encodeURIComponent(JSON.stringify(newLocation)),
    );
  });

  it('calls saveUserLocation with correct arguments', async () => {
    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setLocation(newLocation);
    });

    // Wait for async saveUserLocation call
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mockSaveUserLocation).toHaveBeenCalledWith(
      mockUser.uuid,
      newLocation,
    );
  });

  it('does not call saveUserLocation if userUuid is null', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setLocation(newLocation);
    });

    // Wait for any async calls
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mockSaveUserLocation).not.toHaveBeenCalled();
  });

  it('continues on cookie update even if saveUserLocation fails', async () => {
    mockSaveUserLocation.mockRejectedValue(new Error('Server error'));
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setLocation(newLocation);
    });

    // Location should be updated even if server call fails
    expect(result.current.location).toEqual(newLocation);
    expect(mockSetCookie).toHaveBeenCalled();

    // Wait for async saveUserLocation call to fail
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mockSaveUserLocation).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to save location to server:',
      expect.any(Error),
    );

    consoleWarnSpy.mockRestore();
  });

  it('handles null location without calling setCookie', async () => {
    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Reset mock to check if it's called again
    mockSetCookie.mockClear();

    act(() => {
      result.current.setLocation(null);
    });

    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(mockSaveUserLocation).not.toHaveBeenCalled();
  });

  it('fetches user UUID on mount for persistence', async () => {
    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockGetCurrentUser).toHaveBeenCalled();
  });

  it('reverts location and sets error when setCookie throws', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockSetCookie.mockImplementation(() => {
      throw new Error('Cookie write failed');
    });

    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setLocation(newLocation);
    });

    expect(result.current.location).toEqual(mockLocation);
    expect(result.current.error).toBe('Cookie write failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error updating location:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('sets generic error message for non-Error throws', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockSetCookie.mockImplementation(() => {
      throw 'string error';
    });

    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setLocation(newLocation);
    });

    expect(result.current.error).toBe('Failed to update location');

    consoleErrorSpy.mockRestore();
  });
});
