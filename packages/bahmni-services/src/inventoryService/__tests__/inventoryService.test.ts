import { get } from '../../api';
import { AVAILABLE_STOCKS_URL } from '../constants';
import { getAvailableStocks } from '../inventoryService';
import { AvailableStockResponse } from '../models';

jest.mock('../../api');

const mockGet = get as jest.MockedFunction<typeof get>;

describe('getAvailableStocks', () => {
  const productUuid = 'product-uuid-123';
  const locationUuid = 'location-uuid-456';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [
      'with stock batches',
      {
        count: 2,
        data: [
          {
            stockLocationName: 'Nurse Station',
            availableQuantity: 10,
            onHandQuantity: 15,
            unit: 'vial',
            batchNumber: 'BATCH-001',
            expiryDate: '2026-12-31',
          },
          {
            stockLocationName: 'Nurse Station',
            availableQuantity: 5,
            onHandQuantity: 5,
            unit: 'vial',
            batchNumber: 'BATCH-002',
            expiryDate: '2027-06-30',
          },
        ],
      },
    ],
    [
      'with no stock batches',
      {
        count: 0,
        data: [],
      },
    ],
  ])(
    'fetches available stocks for a product and location (%s)',
    async (_, mockResponse: AvailableStockResponse) => {
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await getAvailableStocks(productUuid, locationUuid);

      expect(get).toHaveBeenCalledWith(
        AVAILABLE_STOCKS_URL(productUuid, locationUuid),
      );
      expect(result).toEqual(mockResponse);
    },
  );

  it('propagates errors from the API', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));

    await expect(getAvailableStocks(productUuid, locationUuid)).rejects.toThrow(
      'Network error',
    );
  });
});
