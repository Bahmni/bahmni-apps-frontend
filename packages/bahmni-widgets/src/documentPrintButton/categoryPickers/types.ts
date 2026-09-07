import { prescriptionEncounterPicker } from './prescriptionEncounterPicker';

export interface PrintOption {
  translationKey: string;
  templateId: string;
  // TODO: shortcutKey is reserved for keyboard shortcut support — not yet implemented
  shortcutKey?: string;
  privileges?: string[];
  // A known, product-defined category. When set and recognized (see categoryPickers
  // below), selecting this option opens a picker to resolve additional context before
  // rendering. An unrecognized category fails loudly rather than falling back silently.
  category?: string;
}

// context carries reference keys (uuids the render API looks up itself);
// data carries arbitrary JSON a picker already has in hand and wants merged
// straight into the template, no backend lookup required. PRESCRIPTION only
// needs the former today, but a future category (e.g. one with no
// backend-resolvable id) can populate data without changing this shape.
export interface PrintPayload {
  context: Record<string, string>;
  data?: Record<string, unknown>;
}

// A category implementation resolves one extra piece of render context (e.g. an
// encounterUuid) via a purpose-built picker before a print option is rendered.
export interface CategoryPicker<TItem> {
  heading: string; // i18n key for the picker modal's heading
  emptyStateMessage: string; // i18n key shown when fetchItems resolves to []
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

// The one place a category is registered. Adding a new category means adding an
// entry here — nothing else needs to know its name at compile time.
export const categoryPickers: Record<
  string,
  CategoryPicker<unknown> | undefined
> = {
  PRESCRIPTION: prescriptionEncounterPicker as CategoryPicker<unknown>,
};
