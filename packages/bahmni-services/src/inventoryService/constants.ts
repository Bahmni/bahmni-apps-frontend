import { OPENMRS_REST_V1 } from '../constants/app';

export const AVAILABLE_STOCKS_URL = (
  productUuid: string,
  locationUuid: string,
) =>
  OPENMRS_REST_V1 +
  `/availableStocks?productUuid=${productUuid}&locationUuid=${locationUuid}`;
