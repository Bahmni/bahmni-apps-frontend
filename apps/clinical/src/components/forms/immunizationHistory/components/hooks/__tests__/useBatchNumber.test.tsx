import { getUserLoginLocation } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { InputControlAttributes } from '../../../../../../providers/clinicalConfig/models';
import { getAvailableStocks } from '../../../../../../services/inventoryService';
import { useBatchNumberLogic } from '../useBatchNumber';

jest.mock('@bahmni/services', () => ({
  getUserLoginLocation: jest.fn(),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  formatDateTime: jest.fn(() => ({
    formattedResult: '31-Dec-2025',
  })),
}));

jest.mock('../../../../../../services/inventoryService', () => ({
  getAvailableStocks: jest.fn(),
}));

const mockGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;
const mockGetAvailableStocks = getAvailableStocks as jest.MockedFunction<
  typeof getAvailableStocks
>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('useBatchNumberLogic', () => {
  const mockAttributes: InputControlAttributes[] = [
    {
      name: 'batchNumber',
      required: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserLoginLocation.mockReturnValue({
      uuid: 'location-123',
      display: 'Test Location',
    } as any);
  });

  it('should return initial state with empty batch items', () => {
    const { result } = renderHook(
      () =>
        useBatchNumberLogic({
          attributes: mockAttributes,
          drugCode: undefined,
          isFetchBatchNumberEnabled: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.batchComboBoxItems).toEqual([]);
    expect(result.current.batchSearchTerm).toBe('');
    expect(result.current.isFetchBatchNumberEnabled).toBe(true);
    expect(result.current.productUuid).toBe('');
  });

  it('should fetch and format batch numbers when enabled', async () => {
    const mockStocks = [
      {
        batchNumber: 'BATCH001',
        expiryDate: '2025-12-31',
        stockLocationName: 'Main Pharmacy',
        availableQuantity: 50,
        onHandQuantity: 50,
        unit: 'vials',
      },
      {
        batchNumber: 'BATCH002',
        expiryDate: '2025-06-30',
        stockLocationName: 'Emergency Ward',
        availableQuantity: 20,
        onHandQuantity: 20,
        unit: 'vials',
      },
    ];

    mockGetAvailableStocks.mockResolvedValue(mockStocks);

    const { result } = renderHook(
      () =>
        useBatchNumberLogic({
          attributes: mockAttributes,
          drugCode: 'drug-123',
          isFetchBatchNumberEnabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.batchComboBoxItems).toHaveLength(2);
    });

    expect(result.current.batchComboBoxItems[0]).toEqual({
      code: 'BATCH001',
      display: 'BATCH001 [31-Dec-2025] - Main Pharmacy',
      expiryDate: '2025-12-31',
      disabled: false,
    });
  });

  it('should filter out stocks without batch numbers', async () => {
    const mockStocks = [
      {
        batchNumber: 'BATCH001',
        expiryDate: '2025-12-31',
        stockLocationName: 'Main Pharmacy',
        availableQuantity: 50,
        onHandQuantity: 50,
        unit: 'vials',
      },
      {
        batchNumber: '',
        expiryDate: '2025-06-30',
        stockLocationName: 'Emergency Ward',
        availableQuantity: 20,
        onHandQuantity: 20,
        unit: 'vials',
      },
      {
        batchNumber: null as any,
        expiryDate: '2025-03-15',
        stockLocationName: 'ICU',
        availableQuantity: 10,
        onHandQuantity: 10,
        unit: 'vials',
      },
    ];

    mockGetAvailableStocks.mockResolvedValue(mockStocks);

    const { result } = renderHook(
      () =>
        useBatchNumberLogic({
          attributes: mockAttributes,
          drugCode: 'drug-123',
          isFetchBatchNumberEnabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.batchComboBoxItems).toHaveLength(1);
    });

    expect(result.current.batchComboBoxItems[0].code).toBe('BATCH001');
  });

  it('should filter batch items based on search term', async () => {
    const mockStocks = [
      {
        batchNumber: 'BATCH001',
        expiryDate: '2025-12-31',
        stockLocationName: 'Main Pharmacy',
        availableQuantity: 50,
        onHandQuantity: 50,
        unit: 'vials',
      },
      {
        batchNumber: 'BATCH002',
        expiryDate: '2025-06-30',
        stockLocationName: 'Emergency Ward',
        availableQuantity: 20,
        onHandQuantity: 20,
        unit: 'vials',
      },
      {
        batchNumber: 'XYZ123',
        expiryDate: '2025-03-15',
        stockLocationName: 'ICU',
        availableQuantity: 10,
        onHandQuantity: 10,
        unit: 'vials',
      },
    ];

    mockGetAvailableStocks.mockResolvedValue(mockStocks);

    const { result } = renderHook(
      () =>
        useBatchNumberLogic({
          attributes: mockAttributes,
          drugCode: 'drug-123',
          isFetchBatchNumberEnabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.batchComboBoxItems).toHaveLength(3);
    });

    // Set search term
    result.current.setBatchSearchTerm('batch');

    await waitFor(() => {
      expect(result.current.batchComboBoxItems).toHaveLength(2);
    });

    expect(result.current.batchComboBoxItems[0].code).toBe('BATCH001');
    expect(result.current.batchComboBoxItems[1].code).toBe('BATCH002');
  });

  it('should handle case-insensitive search', async () => {
    const mockStocks = [
      {
        batchNumber: 'BATCH001',
        expiryDate: '2025-12-31',
        stockLocationName: 'Main Pharmacy',
        availableQuantity: 50,
        onHandQuantity: 50,
        unit: 'vials',
      },
    ];

    mockGetAvailableStocks.mockResolvedValue(mockStocks);

    const { result } = renderHook(
      () =>
        useBatchNumberLogic({
          attributes: mockAttributes,
          drugCode: 'drug-123',
          isFetchBatchNumberEnabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.batchComboBoxItems).toHaveLength(1);
    });

    result.current.setBatchSearchTerm('batch001');

    await waitFor(() => {
      expect(result.current.batchComboBoxItems).toHaveLength(1);
    });
  });

  it('should not fetch when isFetchBatchNumberEnabled is false', () => {
    const { result } = renderHook(
      () =>
        useBatchNumberLogic({
          attributes: mockAttributes,
          drugCode: 'drug-123',
          isFetchBatchNumberEnabled: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetchBatchNumberEnabled).toBe(false);
    expect(mockGetAvailableStocks).not.toHaveBeenCalled();
  });

  it('should not fetch when drugCode is not provided', () => {
    const { result } = renderHook(
      () =>
        useBatchNumberLogic({
          attributes: mockAttributes,
          drugCode: undefined,
          isFetchBatchNumberEnabled: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(mockGetAvailableStocks).not.toHaveBeenCalled();
    expect(result.current.productUuid).toBe('');
  });

  it('should not fetch when location is not available', () => {
    mockGetUserLoginLocation.mockReturnValue(null as any);

    expect(mockGetAvailableStocks).not.toHaveBeenCalled();
  });

  it('should handle loading state', async () => {
    mockGetAvailableStocks.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
    );

    const { result } = renderHook(
      () =>
        useBatchNumberLogic({
          attributes: mockAttributes,
          drugCode: 'drug-123',
          isFetchBatchNumberEnabled: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.stocksLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.stocksLoading).toBe(false);
    });
  });

  it('should default to false when isFetchBatchNumberEnabled is not provided', () => {
    const { result } = renderHook(
      () =>
        useBatchNumberLogic({
          attributes: mockAttributes,
          drugCode: 'drug-123',
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetchBatchNumberEnabled).toBe(false);
  });

  it('should handle empty attributes array', () => {
    const { result } = renderHook(
      () =>
        useBatchNumberLogic({
          attributes: [],
          drugCode: 'drug-123',
          isFetchBatchNumberEnabled: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetchBatchNumberEnabled).toBe(true);
  });

  it('should handle undefined attributes', () => {
    const { result } = renderHook(
      () =>
        useBatchNumberLogic({
          attributes: undefined,
          drugCode: 'drug-123',
          isFetchBatchNumberEnabled: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetchBatchNumberEnabled).toBe(true);
  });
});
