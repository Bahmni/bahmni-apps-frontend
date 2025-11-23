import { ComponentType, LazyExoticComponent } from 'react';
import { WidgetConfig } from './model';
import { builtInWidgets } from './widgetMap';

type WidgetRegistryMap = Map<string, WidgetConfig>;

class WidgetRegistryManager {
  private static instance: WidgetRegistryManager;
  private registry: WidgetRegistryMap;

  private constructor() {
    this.registry = new Map();
    this.registerBuiltInWidgets();
  }

  public static getInstance(): WidgetRegistryManager {
    if (!WidgetRegistryManager.instance) {
      WidgetRegistryManager.instance = new WidgetRegistryManager();
    }
    return WidgetRegistryManager.instance;
  }

  private registerBuiltInWidgets(): void {
    builtInWidgets.forEach((widget) => {
      this.registry.set(widget.type, widget);
    });
  }

  public register(config: WidgetConfig): void {
    if (!config.type || typeof config.type !== 'string') {
      throw new Error('Widget type must be a non-empty string');
    }
    if (!config.component) {
      throw new Error('Widget component is required');
    }

    this.registry.set(config.type, config);
  }

  public get(
    type: string,
  ): LazyExoticComponent<ComponentType<object>> | undefined {
    return this.registry.get(type)?.component;
  }

  public getConfig(type: string): WidgetConfig | undefined {
    return this.registry.get(type);
  }

  public has(type: string): boolean {
    return this.registry.has(type);
  }

  public getAll(): string[] {
    return Array.from(this.registry.keys());
  }

  public getAllConfigs(): WidgetConfig[] {
    return Array.from(this.registry.values());
  }

  public clear(): void {
    this.registry.clear();
  }

  public reset(): void {
    this.registry.clear();
    this.registerBuiltInWidgets();
  }
}

export const registerWidget = (config: WidgetConfig): void => {
  WidgetRegistryManager.getInstance().register(config);
};

export const getWidget = (
  type: string,
): LazyExoticComponent<ComponentType<object>> | undefined => {
  return WidgetRegistryManager.getInstance().get(type);
};

export const getWidgetConfig = (type: string): WidgetConfig | undefined => {
  return WidgetRegistryManager.getInstance().getConfig(type);
};

export const hasWidget = (type: string): boolean => {
  return WidgetRegistryManager.getInstance().has(type);
};

export const getAllWidgetTypes = (): string[] => {
  return WidgetRegistryManager.getInstance().getAll();
};

export const getAllWidgetConfigs = (): WidgetConfig[] => {
  return WidgetRegistryManager.getInstance().getAllConfigs();
};

export const resetWidgetRegistry = (): void => {
  WidgetRegistryManager.getInstance().reset();
};
