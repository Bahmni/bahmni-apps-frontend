import { renderHook } from '@testing-library/react';
import { useGenderData, useIdentifierData } from '../identifierGenderUtils';

jest.mock('@bahmni/services', () => ({
  getGenders: jest.fn(),
  getIdentifierData: jest.fn(),
}));

const mockUseQuery = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
}));

describe('useIdentifierData', () => {
  it('should return identifier prefixes from query data', () => {
    const prefixes = ['BAH', 'GAN'];
    mockUseQuery.mockReturnValue({
      data: {
        prefixes,
        sourcesByPrefix: new Map([['BAH', 'src-1']]),
        primaryIdentifierTypeUuid: 'type-uuid',
        primaryIdentifierTypeName: 'Patient ID',
      },
    });

    const { result } = renderHook(() => useIdentifierData());

    expect(result.current.identifierPrefixes).toEqual(prefixes);
    expect(result.current.primaryIdentifierType).toBe('type-uuid');
    expect(result.current.primaryIdentifierTypeName).toBe('Patient ID');
  });

  it('should return empty defaults when query data is undefined', () => {
    mockUseQuery.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useIdentifierData());

    expect(result.current.identifierPrefixes).toEqual([]);
    expect(result.current.identifierSources).toBeUndefined();
    expect(result.current.primaryIdentifierType).toBeUndefined();
    expect(result.current.primaryIdentifierTypeName).toBeUndefined();
  });
});

describe('useGenderData', () => {
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: { M: 'Male', F: 'Female' },
    });
  });

  it('should return translated gender values', () => {
    const { result } = renderHook(() => useGenderData(mockT));

    expect(result.current.genders).toEqual([
      'CREATE_PATIENT_GENDER_MALE',
      'CREATE_PATIENT_GENDER_FEMALE',
    ]);
  });

  it('should return stable getGenderDisplay reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useGenderData(mockT));
    const firstRef = result.current.getGenderDisplay;

    rerender();

    expect(result.current.getGenderDisplay).toBe(firstRef);
  });

  it('should translate gender code via getGenderDisplay', () => {
    const { result } = renderHook(() => useGenderData(mockT));

    expect(result.current.getGenderDisplay('M')).toBe(
      'CREATE_PATIENT_GENDER_MALE',
    );
  });

  it('should return code as-is when gender code is unknown', () => {
    const { result } = renderHook(() => useGenderData(mockT));

    expect(result.current.getGenderDisplay('X')).toBe('X');
  });

  it('should handle empty gender data', () => {
    mockUseQuery.mockReturnValue({ data: {} });

    const { result } = renderHook(() => useGenderData(mockT));

    expect(result.current.genders).toEqual([]);
  });
});
