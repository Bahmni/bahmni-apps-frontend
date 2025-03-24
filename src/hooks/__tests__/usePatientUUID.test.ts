import { renderHook } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { usePatientUUID } from '../usePatientUUID';
import { extractFirstUuidFromPath } from '@utils/common';

// Mock react-router-dom's useLocation hook
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
}));

// Mock the extractFirstUuidFromPath utility function
jest.mock('@utils/common', () => ({
  extractFirstUuidFromPath: jest.fn(),
}));

describe('usePatientUUID', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call useLocation and extractFirstUuidFromPath', () => {
    // Arrange
    const mockLocation = { pathname: '/patients/123e4567-e89b-12d3-a456-426614174000' };
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
    (extractFirstUuidFromPath as jest.Mock).mockReturnValue('123e4567-e89b-12d3-a456-426614174000');

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(useLocation).toHaveBeenCalled();
    expect(extractFirstUuidFromPath).toHaveBeenCalledWith(mockLocation.pathname);
    expect(result.current).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should return UUID when present in the path', () => {
    // Arrange
    const mockLocation = { pathname: '/patients/123e4567-e89b-12d3-a456-426614174000/details' };
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
    (extractFirstUuidFromPath as jest.Mock).mockReturnValue('123e4567-e89b-12d3-a456-426614174000');

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should return null when no UUID is present in the path', () => {
    // Arrange
    const mockLocation = { pathname: '/patients/list' };
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
    (extractFirstUuidFromPath as jest.Mock).mockReturnValue(null);

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBeNull();
  });

  it('should handle empty pathname', () => {
    // Arrange
    const mockLocation = { pathname: '' };
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
    (extractFirstUuidFromPath as jest.Mock).mockReturnValue(null);

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBeNull();
  });

  it('should handle undefined pathname', () => {
    // Arrange
    const mockLocation = { pathname: undefined };
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
    (extractFirstUuidFromPath as jest.Mock).mockReturnValue(null);

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBeNull();
  });

  it('should handle complex paths with query parameters', () => {
    // Arrange
    const mockLocation = {
      pathname: '/dashboard/patients/123e4567-e89b-12d3-a456-426614174000/visits',
      search: '?date=2023-01-01'
    };
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
    (extractFirstUuidFromPath as jest.Mock).mockReturnValue('123e4567-e89b-12d3-a456-426614174000');

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should handle paths with hash fragments', () => {
    // Arrange
    const mockLocation = {
      pathname: '/patients/123e4567-e89b-12d3-a456-426614174000',
      hash: '#medical-history'
    };
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
    (extractFirstUuidFromPath as jest.Mock).mockReturnValue('123e4567-e89b-12d3-a456-426614174000');

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBe('123e4567-e89b-12d3-a456-426614174000');
  });
});
