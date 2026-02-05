export {
  getFlattenedInvestigations,
  getOrderTypes,
  getCategoryUuidFromOrderTypes,
  getOrderTypeNames,
  getExistingServiceRequestsForAllCategories,
} from './investigationService';
export {
  type ExistingServiceRequest,
  type FlattenedInvestigations,
  type OrderType,
  type OrderTypeResponse,
} from './model';

export { ORDER_TYPE_QUERY_KEY } from './constants';
