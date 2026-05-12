import { get } from '../api';
import { AVAILABLE_STOCKS_URL } from './constants';
import { AvailableStockResponse } from './models';

/**
 * Fetches available stock batches for a given product (vaccine) at a specific location
 * @param productUuid - The UUID of the vaccine/drug product
 * @param locationUuid - The UUID of the location (nurse station)
 * @returns Promise<AvailableStockResponse> - Available stock count and batches with batch number and expiry date
 */
export const getAvailableStocks = async (
  productUuid: string,
  locationUuid: string,
): Promise<AvailableStockResponse> => {
  return await get<AvailableStockResponse>(
    AVAILABLE_STOCKS_URL(productUuid, locationUuid),
  );
};
