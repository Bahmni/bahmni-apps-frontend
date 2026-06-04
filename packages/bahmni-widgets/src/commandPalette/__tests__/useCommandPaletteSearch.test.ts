import {
  searchPatientByNameOrId,
  searchPatientByCustomAttribute,
} from '@bahmni/services';
import { renderHook, act } from '@testing-library/react';
import type { SearchAnnotation } from '../CommandPaletteContext';
import { useCommandPaletteSearch } from '../useCommandPaletteSearch';

jest.mock('@bahmni/services', () => ({
  searchPatientByNameOrId: jest.fn(),
  searchPatientByCustomAttribute: jest.fn(),
}));

const mockSearchByNameOrId = searchPatientByNameOrId as jest.Mock;
const mockSearchByCustomAttribute = searchPatientByCustomAttribute as jest.Mock;

const mockPatient = {
  uuid: 'uuid-1',
  givenName: 'John',
  familyName: 'Doe',
  identifier: 'P001',
};

const phoneAnnotation: SearchAnnotation = {
  prefix: '@phone',
  label: 'Phone',
  searchType: 'patientAttribute',
  fieldType: 'person',
  fieldsToSearch: ['phoneNumber'],
};

const nameOrIdAnnotation: SearchAnnotation = {
  prefix: '@name',
  label: 'Name',
  searchType: 'patientNameOrId',
  fieldType: 'person',
  fieldsToSearch: [],
};

describe('useCommandPaletteSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSearchByNameOrId.mockResolvedValue({ pageOfResults: [mockPatient] });
    mockSearchByCustomAttribute.mockResolvedValue({
      pageOfResults: [mockPatient],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns empty patients and loading false when searchTerm is less than 2 chars', () => {
    const { result } = renderHook(() => useCommandPaletteSearch('a'));

    expect(result.current.patients).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('returns empty patients and loading false for empty searchTerm', () => {
    const { result } = renderHook(() => useCommandPaletteSearch(''));

    expect(result.current.patients).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('sets loading to true immediately when searchTerm reaches 2 chars before debounce fires', () => {
    const { result, rerender } = renderHook(
      ({ term }: { term: string }) => useCommandPaletteSearch(term),
      { initialProps: { term: 'j' } },
    );

    expect(result.current.loading).toBe(false);

    rerender({ term: 'jo' });

    expect(result.current.loading).toBe(true);
    expect(mockSearchByNameOrId).not.toHaveBeenCalled();
  });

  it('calls searchPatientByNameOrId and returns results after debounce fires', async () => {
    const { result } = renderHook(() => useCommandPaletteSearch('jo'));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(mockSearchByNameOrId).toHaveBeenCalledWith('jo');
    expect(result.current.patients).toEqual([mockPatient]);
    expect(result.current.loading).toBe(false);
  });

  it('calls searchPatientByCustomAttribute when activeAnnotation has searchType patientAttribute', async () => {
    const { result } = renderHook(() =>
      useCommandPaletteSearch('123', phoneAnnotation),
    );

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(mockSearchByCustomAttribute).toHaveBeenCalledWith(
      '123',
      'person',
      ['phoneNumber'],
      [{ type: 'person', fields: ['phoneNumber'] }],
      expect.any(Function),
    );
    expect(mockSearchByNameOrId).not.toHaveBeenCalled();
    expect(result.current.patients).toEqual([mockPatient]);
  });

  it('calls searchPatientByNameOrId when activeAnnotation has searchType patientNameOrId', async () => {
    const { result } = renderHook(() =>
      useCommandPaletteSearch('jo', nameOrIdAnnotation),
    );

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(mockSearchByNameOrId).toHaveBeenCalledWith('jo');
    expect(mockSearchByCustomAttribute).not.toHaveBeenCalled();
    expect(result.current.patients).toEqual([mockPatient]);
  });

  it('sets error state and clears loading on search failure', async () => {
    mockSearchByNameOrId.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCommandPaletteSearch('jo'));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(result.current.patients).toEqual([]);
  });
});
