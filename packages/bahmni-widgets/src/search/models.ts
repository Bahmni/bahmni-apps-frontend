export interface SearchWidgetProps {
  extensionParams?: Record<string, unknown>;
}

export type SearchWidgetConfig = Record<string, unknown>;

export interface SearchWidgetConfigContextType {
  searchWidgetConfig: SearchWidgetConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
