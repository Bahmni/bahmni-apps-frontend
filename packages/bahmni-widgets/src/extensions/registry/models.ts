export interface ExtensionWidgetProps {
  configUrl?: string;
}

export interface ExtensionWidget {
  key: string;
  component: React.ComponentType<ExtensionWidgetProps>;
}
