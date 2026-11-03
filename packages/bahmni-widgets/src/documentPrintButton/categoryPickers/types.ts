import { prescriptionEncounterPicker } from './prescriptionEncounterPicker';

export interface PrintOption {
  translationKey: string;
  templateId: string;
  shortcutKey?: string;
  privileges?: string[];
  category?: string;
}

export interface PrintPayload {
  context: Record<string, string>;
  data?: Record<string, unknown>;
}

export interface CategoryPicker<TItem> {
  heading: string;
  emptyStateMessage: string;
  fetchItems: (context: Record<string, string>) => Promise<TItem[]>;
  getItemKey: (item: TItem) => string;
  renderItem: (
    item: TItem,
    t: (key: string) => string,
  ) => { primary: string; secondary?: string };
  resolveSelection: (
    item: TItem,
    context: Record<string, string>,
  ) => PrintPayload;
}

export const categoryPickers: Record<
  string,
  CategoryPicker<unknown> | undefined
> = {
  PRESCRIPTION: prescriptionEncounterPicker as CategoryPicker<unknown>,
};
