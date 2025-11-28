import { renderHook } from '@testing-library/react';
import { useAdditionalIdentifiers } from '../useAdditionalIdentifiers';
import { useIdentifierTypes } from '../useIdentifierTypes';
import { useRegistrationConfig } from '../useRegistrationConfig';

// Mock dependencies
jest.mock('../useIdentifierTypes');
jest.mock('../useRegistrationConfig');

describe('useAdditionalIdentifiers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return shouldShowAdditionalIdentifiers as true when config is enabled and identifiers exist', () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          isExtraPatientIdentifiersSection: true,
        },
      },
    });

    (useIdentifierTypes as jest.Mock).mockReturnValue({
      data: [
        { uuid: '1', name: 'Primary ID', primary: true },
        { uuid: '2', name: 'National ID', primary: false },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdditionalIdentifiers());

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(true);
    expect(result.current.hasAdditionalIdentifiers).toBe(true);
    expect(result.current.isConfigEnabled).toBe(true);
  });

  it('should return shouldShowAdditionalIdentifiers as false when config is disabled', () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          isExtraPatientIdentifiersSection: false,
        },
      },
    });

    (useIdentifierTypes as jest.Mock).mockReturnValue({
      data: [
        { uuid: '1', name: 'Primary ID', primary: true },
        { uuid: '2', name: 'National ID', primary: false },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdditionalIdentifiers());

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(false);
    expect(result.current.hasAdditionalIdentifiers).toBe(true);
    expect(result.current.isConfigEnabled).toBe(false);
  });

  it('should return shouldShowAdditionalIdentifiers as false when no additional identifiers exist', () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          isExtraPatientIdentifiersSection: true,
        },
      },
    });

    (useIdentifierTypes as jest.Mock).mockReturnValue({
      data: [{ uuid: '1', name: 'Primary ID', primary: true }],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdditionalIdentifiers());

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(false);
    expect(result.current.hasAdditionalIdentifiers).toBe(false);
    expect(result.current.isConfigEnabled).toBe(true);
  });

  it('should default isConfigEnabled to true when config is not provided', () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {},
      },
    });

    (useIdentifierTypes as jest.Mock).mockReturnValue({
      data: [
        { uuid: '1', name: 'Primary ID', primary: true },
        { uuid: '2', name: 'National ID', primary: false },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdditionalIdentifiers());

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(true);
    expect(result.current.isConfigEnabled).toBe(true);
  });

  it('should default isConfigEnabled to true when patientInformation is not provided', () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {},
    });

    (useIdentifierTypes as jest.Mock).mockReturnValue({
      data: [
        { uuid: '1', name: 'Primary ID', primary: true },
        { uuid: '2', name: 'National ID', primary: false },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdditionalIdentifiers());

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(true);
    expect(result.current.isConfigEnabled).toBe(true);
  });

  it('should return hasAdditionalIdentifiers as false when identifierTypes is null', () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          isExtraPatientIdentifiersSection: true,
        },
      },
    });

    (useIdentifierTypes as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useAdditionalIdentifiers());

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(false);
    expect(result.current.hasAdditionalIdentifiers).toBe(false);
    expect(result.current.identifierTypes).toBeNull();
  });

  it('should return hasAdditionalIdentifiers as false when identifierTypes is undefined', () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          isExtraPatientIdentifiersSection: true,
        },
      },
    });

    (useIdentifierTypes as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useAdditionalIdentifiers());

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(false);
    expect(result.current.hasAdditionalIdentifiers).toBe(false);
    expect(result.current.identifierTypes).toBeUndefined();
  });

  it('should return isLoading status from useIdentifierTypes', () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          isExtraPatientIdentifiersSection: true,
        },
      },
    });

    (useIdentifierTypes as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { result } = renderHook(() => useAdditionalIdentifiers());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle all identifiers being primary', () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          isExtraPatientIdentifiersSection: true,
        },
      },
    });

    (useIdentifierTypes as jest.Mock).mockReturnValue({
      data: [
        { uuid: '1', name: 'Primary ID 1', primary: true },
        { uuid: '2', name: 'Primary ID 2', primary: true },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdditionalIdentifiers());

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(false);
    expect(result.current.hasAdditionalIdentifiers).toBe(false);
  });

  it('should return identifierTypes array from the hook', () => {
    const mockIdentifiers = [
      { uuid: '1', name: 'Primary ID', primary: true },
      { uuid: '2', name: 'National ID', primary: false },
      { uuid: '3', name: 'Passport', primary: false },
    ];

    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          isExtraPatientIdentifiersSection: true,
        },
      },
    });

    (useIdentifierTypes as jest.Mock).mockReturnValue({
      data: mockIdentifiers,
      isLoading: false,
    });

    const { result } = renderHook(() => useAdditionalIdentifiers());

    expect(result.current.identifierTypes).toEqual(mockIdentifiers);
  });
});
