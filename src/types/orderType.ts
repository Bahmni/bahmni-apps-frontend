import { ConceptClass } from './concepts';

export interface OrderType {
  uuid: string;
  display: string;
  conceptClasses: ConceptClass[];
}

export interface OrderTypeResponse {
  results: OrderType[];
}
