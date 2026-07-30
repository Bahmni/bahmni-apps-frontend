export interface SearchExtensionParam {
  searchHandler?: string;
  configUrl?: string;
}

export interface Extension {
  id: string;
  extensionPointId: string;
  translationKey: string;
  extensionParams?: SearchExtensionParam;
  requiredPrivileges?: string[];
  icon?: string;
}

export interface ExtensionHandlerProps {
  extensions: Extension[];
}
