interface StockBatch {
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
