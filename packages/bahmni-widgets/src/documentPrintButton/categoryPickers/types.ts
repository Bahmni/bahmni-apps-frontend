export type PrintOptionCategory = 'PRESCRIPTION';

export interface PrintOption {
  translationKey: string;
  templateId: string;
  // TODO: shortcutKey is reserved for keyboard shortcut support — not yet implemented
  shortcutKey?: string;
  privileges?: string[];
  // A known, product-defined category. When set and recognized, selecting this
  // option opens a picker to resolve additional context before rendering.
  category?: PrintOptionCategory;
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
  ) => Record<string, string>;
}
