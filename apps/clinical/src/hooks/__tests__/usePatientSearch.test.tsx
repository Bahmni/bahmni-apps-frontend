import {
  type PatientSearchResult,
  searchPatientByNameOrId,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import usePatientSearch from '../usePatientSearch';

jest.mock('@bahmni/services', () => ({
  searchPatientByNameOrId: jest.fn(),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: () => new Promise(() => {}) },
  }),
}));

const mockSearchPatientByNameOrId =
  searchPatientByNameOrId as jest.MockedFunction<
    typeof searchPatientByNameOrId
  >;

const createPatient = (
  overrides: Partial<PatientSearchResult> = {},
): PatientSearchResult => ({
  uuid: 'patient-uuid-1',
  givenName: 'John',
  middleName: '',
  familyName: 'Doe',
  identifier: 'GAN123456',
  birthDate: '1990-01-01',
  gender: 'M',
  extraIdentifiers: null,
  personId: 1,
  deathDate: null,
  addressFieldValue: null,
  patientProgramAttributeValue: null,
  dateCreated: new Date(),
  activeVisitUuid: '',
  customAttribute: '',
  hasBeenAdmitted: false,
  age: '34',
  ...overrides,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('usePatientSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not fetch when searchTerm is empty', () => {
    renderHook(() => usePatientSearch(''), { wrapper: createWrapper() });
    expect(mockSearchPatientByNameOrId).not.toHaveBeenCalled();
  });

  test('does not fetch when searchTerm is only whitespace', () => {
    renderHook(() => usePatientSearch('   '), { wrapper: createWrapper() });
    expect(mockSearchPatientByNameOrId).not.toHaveBeenCalled();
  });

  test('returns empty results initially', () => {
    mockSearchPatientByNameOrId.mockResolvedValue({
      totalCount: 0,
      pageOfResults: [],
    });

    const { result } = renderHook(() => usePatientSearch('GAN123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.results).toEqual([]);
  });

  test('returns matching patients filtered by exact identifier', async () => {
    const matchingPatient = createPatient({ identifier: 'GAN123456' });
    const nonMatchingPatient = createPatient({
      uuid: 'patient-uuid-2',
      identifier: 'GAN999999',
      givenName: 'Jane',
    });

    mockSearchPatientByNameOrId.mockResolvedValue({
      totalCount: 2,
      pageOfResults: [matchingPatient, nonMatchingPatient],
    });

    const { result } = renderHook(() => usePatientSearch('GAN123456'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    expect(result.current.results[0].uuid).toBe('patient-uuid-1');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  test('performs case-insensitive identifier matching', async () => {
    const patient = createPatient({ identifier: 'GAN123456' });

    mockSearchPatientByNameOrId.mockResolvedValue({
      totalCount: 1,
      pageOfResults: [patient],
    });

    const { result } = renderHook(() => usePatientSearch('gan123456'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });
  });

  test('filters out appointment search results using type guard', async () => {
    const patient = createPatient({ identifier: 'GAN123456' });
    const appointmentResult = {
      ...createPatient({
        uuid: 'appt-uuid',
        identifier: 'GAN123456',
      }),
      appointmentNumber: 'APT-001',
    };

    mockSearchPatientByNameOrId.mockResolvedValue({
      totalCount: 2,
      pageOfResults: [patient, appointmentResult],
    });

    const { result } = renderHook(() => usePatientSearch('GAN123456'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    expect(result.current.results[0].uuid).toBe('patient-uuid-1');
  });

  test('returns empty results when no identifiers match exactly', async () => {
    const patient = createPatient({ identifier: 'GAN123456' });

    mockSearchPatientByNameOrId.mockResolvedValue({
      totalCount: 1,
      pageOfResults: [patient],
    });

    const { result } = renderHook(() => usePatientSearch('GAN123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.results).toHaveLength(0);
  });

  test('returns error state when API call fails', async () => {
    mockSearchPatientByNameOrId.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePatientSearch('GAN123456'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.results).toEqual([]);
  });

  test('returns loading state while fetching', () => {
    mockSearchPatientByNameOrId.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePatientSearch('GAN123456'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});
