import { getIdentifierTypes } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdditionalIdentifiers } from '../useAdditionalIdentifiers';
import { useRegistrationConfig } from '../useRegistrationConfig';

// Mock dependencies
jest.mock('@bahmni/services', () => ({
  getIdentifierTypes: jest.fn(),
}));
jest.mock('../useRegistrationConfig');

const mockIdentifierTypes = [
  {
    uuid: 'id-type-1',
    name: 'Patient Identifier',
    description: 'Primary patient identifier',
    format: null,
    required: true,
    primary: true,
    identifierSources: [],
  },
  {
    uuid: 'id-type-2',
    name: 'National ID',
    description: 'National identification number',
    format: null,
    required: false,
    primary: false,
    identifierSources: [],
  },
];

describe('useAdditionalIdentifiers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('should return shouldShowAdditionalIdentifiers as true when config is enabled and identifiers exist', async () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          showExtraPatientIdentifiersSection: true,
        },
      },
    });

    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    const { result } = renderHook(() => useAdditionalIdentifiers(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(true);
    expect(result.current.hasAdditionalIdentifiers).toBe(true);
    expect(result.current.isConfigEnabled).toBe(true);
  });

  it('should return shouldShowAdditionalIdentifiers as false when config is disabled', async () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          showExtraPatientIdentifiersSection: false,
        },
      },
    });

    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    const { result } = renderHook(() => useAdditionalIdentifiers(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(false);
    expect(result.current.hasAdditionalIdentifiers).toBe(true);
    expect(result.current.isConfigEnabled).toBe(false);
  });

  it('should return shouldShowAdditionalIdentifiers as false when no additional identifiers exist', async () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          showExtraPatientIdentifiersSection: true,
        },
      },
    });

    const onlyPrimaryIdentifiers = [
      {
        uuid: 'id-type-1',
        name: 'Primary ID',
        primary: true,
        identifierSources: [],
      },
    ];

    (getIdentifierTypes as jest.Mock).mockResolvedValue(onlyPrimaryIdentifiers);

    const { result } = renderHook(() => useAdditionalIdentifiers(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(false);
    expect(result.current.hasAdditionalIdentifiers).toBe(false);
    expect(result.current.isConfigEnabled).toBe(true);
  });

  it('should default isConfigEnabled to true when config is not provided', async () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {},
      },
    });

    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    const { result } = renderHook(() => useAdditionalIdentifiers(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(true);
    expect(result.current.isConfigEnabled).toBe(true);
  });

  it('should default isConfigEnabled to true when patientInformation is not provided', async () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {},
    });

    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    const { result } = renderHook(() => useAdditionalIdentifiers(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(true);
    expect(result.current.isConfigEnabled).toBe(true);
  });

  it('should return hasAdditionalIdentifiers as false when identifierTypes data is empty', async () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          showExtraPatientIdentifiersSection: true,
        },
      },
    });

    (getIdentifierTypes as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useAdditionalIdentifiers(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(false);
    expect(result.current.hasAdditionalIdentifiers).toBe(false);
  });

  it('should return isLoading status during data fetch', () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          showExtraPatientIdentifiersSection: true,
        },
      },
    });

    (getIdentifierTypes as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    ); // Never resolves

    const { result } = renderHook(() => useAdditionalIdentifiers(), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle all identifiers being primary', async () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          showExtraPatientIdentifiersSection: true,
        },
      },
    });

    const allPrimaryIdentifiers = [
      {
        uuid: '1',
        name: 'Primary ID 1',
        primary: true,
        identifierSources: [],
      },
      {
        uuid: '2',
        name: 'Primary ID 2',
        primary: true,
        identifierSources: [],
      },
    ];

    (getIdentifierTypes as jest.Mock).mockResolvedValue(allPrimaryIdentifiers);

    const { result } = renderHook(() => useAdditionalIdentifiers(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(false);
    expect(result.current.hasAdditionalIdentifiers).toBe(false);
  });

  it('should return identifierTypes array from the hook', async () => {
    const mockIdentifiers = [
      {
        uuid: '1',
        name: 'Primary ID',
        primary: true,
        identifierSources: [],
      },
      {
        uuid: '2',
        name: 'National ID',
        primary: false,
        identifierSources: [],
      },
      {
        uuid: '3',
        name: 'Passport',
        primary: false,
        identifierSources: [],
      },
    ];

    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          showExtraPatientIdentifiersSection: true,
        },
      },
    });

    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifiers);

    const { result } = renderHook(() => useAdditionalIdentifiers(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.identifierTypes).toEqual(mockIdentifiers);
  });

  it('should handle multiple non-primary identifiers', async () => {
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: {
        patientInformation: {
          showExtraPatientIdentifiersSection: true,
        },
      },
    });

    const mixedIdentifiers = [
      {
        uuid: '1',
        name: 'Primary ID',
        primary: true,
        identifierSources: [],
      },
      {
        uuid: '2',
        name: 'National ID',
        primary: false,
        identifierSources: [],
      },
      {
        uuid: '3',
        name: 'Passport',
        primary: false,
        identifierSources: [],
      },
      {
        uuid: '4',
        name: 'Driver License',
        primary: false,
        identifierSources: [],
      },
    ];

    (getIdentifierTypes as jest.Mock).mockResolvedValue(mixedIdentifiers);

    const { result } = renderHook(() => useAdditionalIdentifiers(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowAdditionalIdentifiers).toBe(true);
    expect(result.current.hasAdditionalIdentifiers).toBe(true);
    expect(result.current.identifierTypes).toEqual(mixedIdentifiers);
  });
});
