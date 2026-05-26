import type { CDSCard } from '@bahmni/services';

export interface CDSSCheckEventDetail {
  controlKey: string;
  itemId: string;
  event: string;
}

export interface CDSSResultsEventDetail {
  cards: CDSCard[];
  triggerItemId: string;
  controlKey: string;
}
