export interface ExtensionParams {
  searchHandler: string;
  configUrl: string;
}

export interface Extension {
  id: string;
  extensionPointId: string;
  type: string;
  translationKey: string;
  extensionParams: ExtensionParams;
  requiredPrivileges?: string[];
  icon?: string;
}

export interface ExtensionConfigContextType {
  extensions: Extension[];
  isLoading: boolean;
  error: Error | null;
}
