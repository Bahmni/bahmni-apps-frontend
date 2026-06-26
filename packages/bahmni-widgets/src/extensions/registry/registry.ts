import { ExtensionWidget } from './models';

const extensionWidgetRegistry: ExtensionWidget[] = [];

export const registerExtensionWidget = (entry: ExtensionWidget): void => {
  extensionWidgetRegistry.push(entry);
};

export const getExtensionWidget = (key: string): ExtensionWidget | undefined =>
  extensionWidgetRegistry.find((entry) => entry.key === key);

export const clearExtensionWidget = (): void => {
  extensionWidgetRegistry.length = 0;
};
