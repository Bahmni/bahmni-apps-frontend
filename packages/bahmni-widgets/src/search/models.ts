import { ExtensionWidgetProps } from '../extensions/registry';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SearchWidgetProps extends ExtensionWidgetProps {}

export type SearchWidgetConfig = Record<string, unknown>;

export interface SearchWidgetConfigContextType {
  searchWidgetConfig: SearchWidgetConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
