import { get } from '@bahmni/services';
import { AVAILABLE_STOCKS_URL } from '../../constants/app';
import {
  getAvailableStocks,
  AvailableStockResponse,
} from '../inventoryService';

jest.mock('@bahmni/services', () => ({
  get: jest.fn(),
}));

jest.mock('../../constants/app', () => ({
  AVAILABLE_STOCKS_URL: jest.fn(
    (productUuid: string, locationUuid: string) =>
      `/api/stocks?product=${productUuid}&location=${locationUuid}`,
  ),
}));

describe('inventoryService', () => {
  const mockGet = get as jest.MockedFunction<typeof get>;
  const productUuid = 'product-123';
  const locationUuid = 'location-456';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAvailableStocks', () => {
    it('should fetch and return available stocks successfully', async () => {
      const mockResponse: AvailableStockResponse = {
        count: 2,
        data: [
          {
            stockLocationName: 'Main Pharmacy',
            availableQuantity: 50,
            onHandQuantity: 50,
            unit: 'vials',
            batchNumber: 'BATCH001',
            expiryDate: '2025-12-31',
          },
          {
            stockLocationName: 'Emergency Ward',
            availableQuantity: 20,
            onHandQuantity: 20,
            unit: 'vials',
            batchNumber: 'BATCH002',
            expiryDate: '2025-06-30',
          },
        ],
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await getAvailableStocks(productUuid, locationUuid);

      expect(mockGet).toHaveBeenCalledWith(
        AVAILABLE_STOCKS_URL(productUuid, locationUuid),
      );
      expect(result).toEqual(mockResponse.data);
      expect(result).toHaveLength(2);
      expect(result[0].batchNumber).toBe('BATCH001');
    });

    it('should return empty array when response data is null', async () => {
      const mockResponse: AvailableStockResponse = {
        count: 0,
        data: null as any,
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await getAvailableStocks(productUuid, locationUuid);

      expect(result).toEqual([]);
    });

    it('should return empty array when response data is undefined', async () => {
      const mockResponse = {
        count: 0,
      } as AvailableStockResponse;

      mockGet.mockResolvedValue(mockResponse);

      const result = await getAvailableStocks(productUuid, locationUuid);

      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully and return empty array', async () => {
      const error = new Error('Network error');
      mockGet.mockRejectedValue(error);

      const result = await getAvailableStocks(productUuid, locationUuid);

      expect(result).toEqual([]);
      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch available stocks:',
        error,
      );
    });

    it('should handle empty data array', async () => {
      const mockResponse: AvailableStockResponse = {
        count: 0,
        data: [],
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await getAvailableStocks(productUuid, locationUuid);

      expect(result).toEqual([]);
    });

    it('should construct correct URL with product and location UUIDs', async () => {
      const mockResponse: AvailableStockResponse = {
        count: 0,
        data: [],
      };

      mockGet.mockResolvedValue(mockResponse);

      await getAvailableStocks(productUuid, locationUuid);

      expect(AVAILABLE_STOCKS_URL).toHaveBeenCalledWith(
        productUuid,
        locationUuid,
      );
    });
  });
});
