import { type WhiteLabelConfig } from '@bahmni/design-system';

export type { WhiteLabelConfig };

export interface WhiteLabelContextType {
  whiteLabelConfig: WhiteLabelConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
