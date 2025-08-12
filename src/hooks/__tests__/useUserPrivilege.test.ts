import { renderHook } from '@testing-library/react';
import React from 'react';

import { UserPrivilegeContextType } from '@contexts/UserPrivilegeContext';
import { UserPrivilegeProvider } from '@providers/UserPrivilegeProvider';

import { useUserPrivilege } from '../useUserPrivilege';

// Mock notification service
jest.mock('@services/notificationService', () => ({
  showError: jest.fn(),
}));

// Wrapper component to provide the UserPrivilegeContext
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(UserPrivilegeProvider, null, children);

describe('useUserPrivilege', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the context values with user privileges', () => {
    // Arrange
    const mockPrivileges = [
      { name: 'app:clinical:observationForms' },
      { name: 'view:forms' },
    ];

    const mockContextValue: UserPrivilegeContextType = {
      userPrivileges: mockPrivileges,
      setUserPrivileges: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    };

    // Mock the UserPrivilegeContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    // Act
    const { result } = renderHook(() => useUserPrivilege(), { wrapper });

    // Assert
    expect(result.current).toEqual(mockContextValue);
    expect(result.current.userPrivileges).toEqual(mockPrivileges);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle error state when privilege service fails', () => {
    // Arrange
    const mockError = new Error('Failed to fetch privileges');
    const mockContextValue: UserPrivilegeContextType = {
      userPrivileges: null,
      setUserPrivileges: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: mockError,
      setError: jest.fn(),
    };

    // Mock the UserPrivilegeContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    // Act
    const { result } = renderHook(() => useUserPrivilege(), { wrapper });

    // Assert
    expect(result.current.error).toEqual(mockError);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.userPrivileges).toBeNull();
  });

  it('should handle null privileges response', () => {
    // Arrange
    const mockContextValue: UserPrivilegeContextType = {
      userPrivileges: null,
      setUserPrivileges: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    };

    // Mock the UserPrivilegeContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    // Act
    const { result } = renderHook(() => useUserPrivilege(), { wrapper });

    // Assert
    expect(result.current.userPrivileges).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle empty privileges array', () => {
    // Arrange
    const mockContextValue: UserPrivilegeContextType = {
      userPrivileges: [],
      setUserPrivileges: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    };

    // Mock the UserPrivilegeContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    // Act
    const { result } = renderHook(() => useUserPrivilege(), { wrapper });

    // Assert
    expect(result.current.userPrivileges).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle network timeout errors', () => {
    // Arrange
    const timeoutError = new Error('Request timeout');
    const mockContextValue: UserPrivilegeContextType = {
      userPrivileges: null,
      setUserPrivileges: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: timeoutError,
      setError: jest.fn(),
    };

    // Mock the UserPrivilegeContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    // Act
    const { result } = renderHook(() => useUserPrivilege(), { wrapper });

    // Assert
    expect(result.current.error).toEqual(timeoutError);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.userPrivileges).toBeNull();
  });
});
