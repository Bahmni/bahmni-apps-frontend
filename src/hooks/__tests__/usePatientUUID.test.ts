import { renderHook } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { usePatientUUID } from '../usePatientUUID';
// Mock react-router-dom's useParams hook
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

describe('usePatientUUID', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call useParams and return patientUuid', () => {
    // Arrange
    const mockParams = {
      patientUuid: '123e4567-e89b-12d3-a456-426614174000',
    };
    (useParams as jest.Mock).mockReturnValue(mockParams);

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(useParams).toHaveBeenCalled();
    expect(result.current).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should return UUID when present in the params', () => {
    // Arrange
    const mockParams = {
      patientUuid: '123e4567-e89b-12d3-a456-426614174000',
    };
    (useParams as jest.Mock).mockReturnValue(mockParams);

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should return null when no UUID is present in the params', () => {
    // Arrange
    const mockParams = {}; // No patientUuid in params
    (useParams as jest.Mock).mockReturnValue(mockParams);

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBeNull();
  });

  it('should handle empty patientUuid', () => {
    // Arrange
    const mockParams = { patientUuid: '' };
    (useParams as jest.Mock).mockReturnValue(mockParams);

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBeNull();
  });

  it('should handle undefined patientUuid', () => {
    // Arrange
    const mockParams = { patientUuid: undefined };
    (useParams as jest.Mock).mockReturnValue(mockParams);

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBeNull();
  });

  it('should handle patientUuid with additional params', () => {
    // Arrange
    const mockParams = {
      patientUuid: '123e4567-e89b-12d3-a456-426614174000',
      visitId: '12345',
      date: '2023-01-01',
    };
    (useParams as jest.Mock).mockReturnValue(mockParams);

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should handle patientUuid with special characters', () => {
    // Arrange
    const mockParams = {
      patientUuid: '123e4567-e89b-12d3-a456-426614174000',
      hash: '#medical-history',
    };
    (useParams as jest.Mock).mockReturnValue(mockParams);

    // Act
    const { result } = renderHook(() => usePatientUUID());

    // Assert
    expect(result.current).toBe('123e4567-e89b-12d3-a456-426614174000');
  });
});
