import * as services from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import {
  useAddressFieldsWithConfig,
  useAddressHierarchyLevels,
} from '../useAddressFieldsWithConfig';
import * as useRegistrationConfigModule from '../useRegistrationConfig';

// Mock dependencies
jest.mock('@bahmni/services');
jest.mock('../useRegistrationConfig');

const mockGetOrderedAddressHierarchyLevels =
  services.getOrderedAddressHierarchyLevels as jest.MockedFunction<
    typeof services.getOrderedAddressHierarchyLevels
  >;

const mockUseRegistrationConfig =
  useRegistrationConfigModule.useRegistrationConfig as jest.MockedFunction<
    typeof useRegistrationConfigModule.useRegistrationConfig
  >;

describe('useAddressFieldsWithConfig', () => {
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

  afterEach(async () => {
    queryClient.clear();
    await queryClient.cancelQueries();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockAddressLevelsFromApi = [
    {
      addressField: 'stateProvince',
      name: 'State',
      required: true,
    },
    {
      addressField: 'countyDistrict',
      name: 'District',
      required: false,
    },
    {
      addressField: 'cityVillage',
      name: 'City',
      required: false,
    },
  ];

  const mockRegistrationConfig = {
    patientInformation: {
      addressHierarchy: {
        showAddressFieldsTopDown: true,
        strictAutocompleteFromLevel: 'countyDistrict',
      },
    },
  };

  describe('Successful Address Levels Loading', () => {
    it('should fetch and transform address hierarchy levels from API', async () => {
      mockGetOrderedAddressHierarchyLevels.mockResolvedValue(
        mockAddressLevelsFromApi,
      );
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: mockRegistrationConfig,
      } as any);

      const { result } = renderHook(() => useAddressFieldsWithConfig(), {
        wrapper,
      });

      expect(result.current.isLoadingLevels).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoadingLevels).toBe(false);
      });

      expect(mockGetOrderedAddressHierarchyLevels).toHaveBeenCalledTimes(1);
      expect(result.current.addressLevelsFromApi).toEqual(
        mockAddressLevelsFromApi,
      );
      expect(result.current.displayLevels).toHaveLength(3);
    });

    it('should apply top-down display order from config', async () => {
      mockGetOrderedAddressHierarchyLevels.mockResolvedValue(
        mockAddressLevelsFromApi,
      );
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: mockRegistrationConfig,
      } as any);

      const { result } = renderHook(() => useAddressFieldsWithConfig(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoadingLevels).toBe(false);
      });

      // Should maintain order for top-down
      expect(result.current.displayLevels.map((l) => l.addressField)).toEqual([
        'stateProvince',
        'countyDistrict',
        'cityVillage',
      ]);
    });

    it('should apply bottom-up display order from config', async () => {
      mockGetOrderedAddressHierarchyLevels.mockResolvedValue(
        mockAddressLevelsFromApi,
      );
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            addressHierarchy: {
              showAddressFieldsTopDown: false,
              strictAutocompleteFromLevel: 'countyDistrict',
            },
          },
        },
      } as any);

      const { result } = renderHook(() => useAddressFieldsWithConfig(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoadingLevels).toBe(false);
      });

      // Should reverse order for bottom-up
      expect(result.current.displayLevels.map((l) => l.addressField)).toEqual([
        'cityVillage',
        'countyDistrict',
        'stateProvince',
      ]);
    });

    it('should apply strict autocomplete configuration', async () => {
      mockGetOrderedAddressHierarchyLevels.mockResolvedValue(
        mockAddressLevelsFromApi,
      );
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: mockRegistrationConfig,
      } as any);

      const { result } = renderHook(() => useAddressFieldsWithConfig(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoadingLevels).toBe(false);
      });

      const levels = result.current.levelsWithStrictEntry;

      // Cascade algorithm: from configured level upwards (to parents) are strict
      // stateProvince is parent of countyDistrict, should be strict
      expect(
        levels.find((l) => l.addressField === 'stateProvince')?.isStrictEntry,
      ).toBe(true);

      // countyDistrict itself should be strict (configured level)
      expect(
        levels.find((l) => l.addressField === 'countyDistrict')?.isStrictEntry,
      ).toBe(true);

      // cityVillage is child of countyDistrict, should NOT be strict
      expect(
        levels.find((l) => l.addressField === 'cityVillage')?.isStrictEntry,
      ).toBe(false);
    });

    it('should initialize with initial address data', async () => {
      mockGetOrderedAddressHierarchyLevels.mockResolvedValue(
        mockAddressLevelsFromApi,
      );
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: mockRegistrationConfig,
      } as any);

      const initialAddress = {
        stateProvince: 'Karnataka',
        cityVillage: 'Bangalore',
      };

      const { result } = renderHook(
        () => useAddressFieldsWithConfig(initialAddress),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.isLoadingLevels).toBe(false);
      });

      expect(result.current.address).toEqual(initialAddress);
    });
  });

  describe('API Error Handling', () => {
    it('should return default address levels when API fails', async () => {
      mockGetOrderedAddressHierarchyLevels.mockRejectedValue(
        new Error('API Error'),
      );
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: mockRegistrationConfig,
      } as any);

      const { result } = renderHook(() => useAddressFieldsWithConfig(), {
        wrapper,
      });

      await waitFor(
        () => {
          expect(result.current.isErrorLevels).toBe(true);
        },
        { timeout: 5000 },
      );

      // Should fall back to default levels
      expect(result.current.displayLevels).toHaveLength(6);
      expect(result.current.displayLevels.map((l) => l.addressField)).toContain(
        'address1',
      );
      expect(result.current.displayLevels.map((l) => l.addressField)).toContain(
        'address2',
      );
    });

    it('should return default levels when API returns empty array', async () => {
      mockGetOrderedAddressHierarchyLevels.mockResolvedValue([]);
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: mockRegistrationConfig,
      } as any);

      const { result } = renderHook(() => useAddressFieldsWithConfig(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoadingLevels).toBe(false);
      });

      // Should use default levels
      expect(result.current.displayLevels).toHaveLength(6);
    });
  });

  describe('Config Default Values', () => {
    it('should use default config when registration config is not available', async () => {
      mockGetOrderedAddressHierarchyLevels.mockResolvedValue(
        mockAddressLevelsFromApi,
      );
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: undefined,
      } as any);

      const { result } = renderHook(() => useAddressFieldsWithConfig(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoadingLevels).toBe(false);
      });

      // Should default to bottom-up (showAddressFieldsTopDown: false)
      expect(result.current.displayLevels.map((l) => l.addressField)).toEqual([
        'cityVillage',
        'countyDistrict',
        'stateProvince',
      ]);
    });

    it('should handle missing address hierarchy config', async () => {
      mockGetOrderedAddressHierarchyLevels.mockResolvedValue(
        mockAddressLevelsFromApi,
      );
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {},
        },
      } as any);

      const { result } = renderHook(() => useAddressFieldsWithConfig(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoadingLevels).toBe(false);
      });

      expect(result.current.displayLevels).toHaveLength(3);
    });
  });

  describe('useAddressHierarchyLevels', () => {
    it('should fetch address hierarchy levels only', async () => {
      mockGetOrderedAddressHierarchyLevels.mockResolvedValue(
        mockAddressLevelsFromApi,
      );

      const { result } = renderHook(() => useAddressHierarchyLevels(), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addressLevels).toEqual(mockAddressLevelsFromApi);
      expect(result.current.isError).toBe(false);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch');
      mockGetOrderedAddressHierarchyLevels.mockRejectedValue(error);

      const { result } = renderHook(() => useAddressHierarchyLevels(), {
        wrapper,
      });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 },
      );

      expect(result.current.addressLevels).toEqual([]);
    });

    it('should return empty array when API returns undefined', async () => {
      // Suppress console errors for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockGetOrderedAddressHierarchyLevels.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useAddressHierarchyLevels(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addressLevels).toEqual([]);

      consoleSpy.mockRestore();
    });
  });
});
