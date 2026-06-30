export interface Extension {
  id: string;
  extensionPointId: string;
  type: string;
  translationKey: string;
  extensionParams?: {
    searchHandler?: string;
    configUrl?: string;
  };
  requiredPrivileges?: string[];
  icon?: string;
}

export interface ExtensionHandlerProps {
  extensions: Extension[];
}
