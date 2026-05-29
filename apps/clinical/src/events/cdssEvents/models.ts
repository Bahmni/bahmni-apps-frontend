import type { CDSCard, CDSSRule } from '@bahmni/services';

export interface CDSSCheckEventDetail {
  controlKey: string;
  itemId: string;
  rules: CDSSRule[];
}

export interface CDSSResultsEventDetail {
  cards: CDSCard[];
  triggerItemId: string;
  controlKey: string;
}
