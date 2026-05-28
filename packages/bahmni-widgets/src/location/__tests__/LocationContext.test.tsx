import {
  getUserLoginLocation,
  getAvailableLocations,
  getCurrentUser,
  saveUserLocation,
  updateSessionLocation,
  setCookie,
} from '@bahmni/services';
import { renderHook, act } from '@testing-library/react';
import { useLocation } from '../LocationContext';
import { LocationProvider } from '../LocationProvider';

jest.mock('@bahmni/services', () => ({
  getUserLoginLocation: jest.fn(),
  getAvailableLocations: jest.fn(),
  getCurrentUser: jest.fn(),
  saveUserLocation: jest.fn(),
  updateSessionLocation: jest.fn(),
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
const mockUpdateSessionLocation = updateSessionLocation as jest.MockedFunction<
  typeof updateSessionLocation
>;
const mockSetCookie = setCookie as jest.MockedFunction<typeof setCookie>;

describe('LocationContext', () => {
  const mockLocation = {
    name: 'General Ward',
    uuid: 'location-uuid-123',
  };

  const mockLocations = [
    { name: 'General Ward', uuid: 'location-uuid-123' },
    { name: 'ICU Ward', uuid: 'location-uuid-456' },
  ];

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
    mockUpdateSessionLocation.mockResolvedValue(undefined);
    mockSetCookie.mockImplementation(() => {});
  });

  it('provides location from server session on initial load', async () => {
    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.location).toEqual(mockLocation);
    expect(result.current.loading).toBe(false);
  });

  it('updates location when setLocation is called', async () => {
    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    const newLocation = {
      name: 'ICU Ward',
      uuid: 'location-uuid-456',
    };

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setLocation(newLocation);
    });

    expect(result.current.location).toEqual(newLocation);
  });

  it('throws error when useLocation is used outside provider', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useLocation());
    }).toThrow('useLocation must be used within LocationProvider');

    consoleErrorSpy.mockRestore();
  });

  it('handles getUserLoginLocation error gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockGetUserLoginLocation.mockImplementation(() => {
      throw new Error('Location fetch failed');
    });

    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.location).toBeNull();
    expect(result.current.error).toBeTruthy();

    consoleErrorSpy.mockRestore();
  });

  it('fetches available locations on mount', async () => {
    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.availableLocations).toEqual(mockLocations);
    expect(mockGetAvailableLocations).toHaveBeenCalled();
  });

  it('sets error state when location fetch fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockGetUserLoginLocation.mockImplementation(() => {
      throw new Error('Server error');
    });

    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    const { result } = renderHook(() => useLocation(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Server error');

    consoleErrorSpy.mockRestore();
  });
});
