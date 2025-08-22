import { renderHook } from '@testing-library/react';
import React from 'react';
import { UserPrivilegeContext } from '@contexts/UserPrivilegeContext';
import { UserPrivilege } from '@utils/privilegeUtils';
import { useUserPrivilege } from '../useUserPrivilege';

// Mock the privilegeService
jest.mock('@services/privilegeService', () => ({
  fetchUserPrivileges: jest.fn(),
}));

describe('useUserPrivilege', () => {
  const mockSetUserPrivileges = jest.fn();
  const mockSetIsLoading = jest.fn();
  const mockSetError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return context value when used within UserPrivilegeProvider', () => {
    const mockPrivileges: UserPrivilege[] = [
      { name: 'Get Patients' },
      { name: 'Add Drug Groups' },
    ];

    const mockContextValue = {
      userPrivileges: mockPrivileges,
      setUserPrivileges: mockSetUserPrivileges,
      isLoading: false,
      setIsLoading: mockSetIsLoading,
      error: null,
      setError: mockSetError,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        UserPrivilegeContext.Provider,
        { value: mockContextValue },
        children,
      );

    const { result } = renderHook(() => useUserPrivilege(), { wrapper });

    expect(result.current).toEqual(mockContextValue);
  });

  it('should throw error when used outside UserPrivilegeProvider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useUserPrivilege());
    }).toThrow('useUserPrivilege must be used within a UserPrivilegeProvider');

    consoleSpy.mockRestore();
  });

  it('should return loading state when context is loading', () => {
    const mockContextValue = {
      userPrivileges: [],
      setUserPrivileges: mockSetUserPrivileges,
      isLoading: true,
      setIsLoading: mockSetIsLoading,
      error: null,
      setError: mockSetError,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        UserPrivilegeContext.Provider,
        { value: mockContextValue },
        children,
      );

    const { result } = renderHook(() => useUserPrivilege(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.userPrivileges).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should return error state when context has error', () => {
    const mockError = new Error('Failed to fetch privileges');
    const mockContextValue = {
      userPrivileges: [],
      setUserPrivileges: mockSetUserPrivileges,
      isLoading: false,
      setIsLoading: mockSetIsLoading,
      error: mockError,
      setError: mockSetError,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        UserPrivilegeContext.Provider,
        { value: mockContextValue },
        children,
      );

    const { result } = renderHook(() => useUserPrivilege(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.userPrivileges).toEqual([]);
    expect(result.current.error).toBe(mockError);
  });

  it('should return privileges when context has privileges', () => {
    const mockPrivileges: UserPrivilege[] = [
      { name: 'Get Patients' },
      { name: 'Add Drug Groups' },
      { name: 'Edit Forms' },
    ];

    const mockContextValue = {
      userPrivileges: mockPrivileges,
      setUserPrivileges: mockSetUserPrivileges,
      isLoading: false,
      setIsLoading: mockSetIsLoading,
      error: null,
      setError: mockSetError,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        UserPrivilegeContext.Provider,
        { value: mockContextValue },
        children,
      );

    const { result } = renderHook(() => useUserPrivilege(), { wrapper });

    expect(result.current.userPrivileges).toEqual(mockPrivileges);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return null privileges when context has null privileges', () => {
    const mockContextValue = {
      userPrivileges: null,
      setUserPrivileges: mockSetUserPrivileges,
      isLoading: false,
      setIsLoading: mockSetIsLoading,
      error: null,
      setError: mockSetError,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        UserPrivilegeContext.Provider,
        { value: mockContextValue },
        children,
      );

    const { result } = renderHook(() => useUserPrivilege(), { wrapper });

    expect(result.current.userPrivileges).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
