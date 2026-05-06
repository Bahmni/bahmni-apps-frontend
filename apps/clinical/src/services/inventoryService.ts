import { get } from '@bahmni/services';

export interface StockBatch {
  stockLocationName: string;
  availableQuantity: number;
  onHandQuantity: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
}

export interface AvailableStockResponse {
  count: number;
  data: StockBatch[];
}

const GET_AVAILABLE_STOCKS_URL = (productUuid: string, locationUuid: string) =>
  `/openmrs/ws/rest/v1/availableStocks?productUuid=${productUuid}&locationUuid=${locationUuid}`;

/**
 * Fetches available stock batches for a given product (vaccine) at a specific location
 * @param productUuid - The UUID of the vaccine/drug product
 * @param locationUuid - The UUID of the location (nurse station)
 * @returns Promise<StockBatch[]> - Array of available stock batches with batch number and expiry date
 */
export const getAvailableStocks = async (
  productUuid: string,
  locationUuid: string,
): Promise<StockBatch[]> => {
  try {
    const response = await get<AvailableStockResponse>(
      GET_AVAILABLE_STOCKS_URL(productUuid, locationUuid),
    );
    return response.data ?? [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch available stocks:', error);
    return [];
  }
};
