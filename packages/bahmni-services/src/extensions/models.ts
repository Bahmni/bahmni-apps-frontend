export interface SearchExtensionParam {
  searchHandler?: string;
  configUrl?: string;
}

export type ExtensionButtonKind =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'danger';

export interface ActionExtensionParam {
  type: string;
  order?: number;
  url?: string;
  shortcutKey?: string;
  buttonKind?: ExtensionButtonKind;
}

type ExtensionParams = SearchExtensionParam | ActionExtensionParam;

export interface Extension {
  id: string;
  extensionPointId: string;
  translationKey?: string;
  extensionParams?: ExtensionParams;
  requiredPrivileges?: string[];
  icon?: string;
}

export type SearchExtension = Omit<Extension, 'extensionParams'> & {
  extensionParams?: SearchExtensionParam;
};

export type ActionExtension = Omit<Extension, 'extensionParams'> & {
  extensionParams?: ActionExtensionParam;
};
