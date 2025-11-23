import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Configuration for registering a widget in the registry
 */
export interface WidgetConfig {
  /** Unique identifier for the widget type */
  type: string;
  /** Lazy-loaded React component */
  component: LazyExoticComponent<ComponentType<any>>;
}

/**
 * Internal registry type using Map for better performance and flexibility
 */
type WidgetRegistryMap = Map<string, WidgetConfig>;

/**
 * Singleton Widget Registry Manager
 *
 * Manages a global registry of widgets that can be dynamically registered
 * and retrieved. Supports both built-in widgets and external widget registration.
 *
 * @example
 * ```typescript
 * // Register a custom widget
 * registerWidget({
 *   type: 'customWidget',
 *   component: lazy(() => import('./CustomWidget')),
 *   metadata: { name: 'Custom Widget', version: '1.0.0' }
 * });
 *
 * // Retrieve and use the widget
 * const Widget = getWidget('customWidget');
 * ```
 */
class WidgetRegistryManager {
  private static instance: WidgetRegistryManager;
  private registry: WidgetRegistryMap;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.registry = new Map();
    this.registerBuiltInWidgets();
  }

  /**
   * Get the singleton instance of the registry manager
   */
  public static getInstance(): WidgetRegistryManager {
    if (!WidgetRegistryManager.instance) {
      WidgetRegistryManager.instance = new WidgetRegistryManager();
    }
    return WidgetRegistryManager.instance;
  }

  /**
   * Register all built-in widgets that come with the package
   * These can be overridden by external registrations
   */
  private registerBuiltInWidgets(): void {
    const builtInWidgets: WidgetConfig[] = [
      {
        type: 'allergies',
        component: lazy(() => import('../allergies/AllergiesTable')),
      },
      {
        type: 'conditions',
        component: lazy(() => import('../conditions/ConditionsTable')),
      },
      {
        type: 'diagnosis',
        component: lazy(() => import('../diagnoses/DiagnosesTable')),
      },
      {
        type: 'labOrders',
        component: lazy(() => import('../labinvestigation/LabInvestigation')),
      },
      {
        type: 'pacsOrders',
        component: lazy(
          () => import('../radiologyInvestigation/RadiologyInvestigationTable'),
        ),
      },
      {
        type: 'treatment',
        component: lazy(() => import('../medications/MedicationsTable')),
      },
      {
        type: 'flowSheet',
        component: lazy(() => import('../vitalFlowSheet/VitalFlowSheet')),
      },
    ];

    builtInWidgets.forEach((widget) => {
      this.registry.set(widget.type, widget);
    });
  }

  /**
   * Register a widget in the registry
   * If a widget with the same type already exists, it will be overridden
   *
   * @param config - Widget configuration
   */
  public register(config: WidgetConfig): void {
    if (!config.type || typeof config.type !== 'string') {
      throw new Error('Widget type must be a non-empty string');
    }
    if (!config.component) {
      throw new Error('Widget component is required');
    }

    this.registry.set(config.type, config);
  }

  /**
   * Get a widget component by type
   *
   * @param type - Widget type identifier
   * @returns The lazy-loaded component or undefined if not found
   */
  public get(
    type: string,
  ): LazyExoticComponent<ComponentType<any>> | undefined {
    return this.registry.get(type)?.component;
  }

  /**
   * Get full widget configuration by type
   *
   * @param type - Widget type identifier
   * @returns The widget configuration or undefined if not found
   */
  public getConfig(type: string): WidgetConfig | undefined {
    return this.registry.get(type);
  }

  /**
   * Check if a widget type is registered
   *
   * @param type - Widget type identifier
   * @returns true if the widget is registered, false otherwise
   */
  public has(type: string): boolean {
    return this.registry.has(type);
  }

  /**
   * Get all registered widget types
   *
   * @returns Array of widget type identifiers
   */
  public getAll(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Get all registered widget configurations
   *
   * @returns Array of widget configurations
   */
  public getAllConfigs(): WidgetConfig[] {
    return Array.from(this.registry.values());
  }

  /**
   * Clear all registered widgets (useful for testing)
   * Note: This will also clear built-in widgets
   */
  public clear(): void {
    this.registry.clear();
  }

  /**
   * Reset registry to initial state with only built-in widgets
   */
  public reset(): void {
    this.registry.clear();
    this.registerBuiltInWidgets();
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Register a widget in the global registry
 *
 * This function allows external projects to register custom widgets
 * that can be rendered in the clinical dashboard. Widgets can also
 * override built-in widgets by using the same type identifier.
 *
 * @param config - Widget configuration
 *
 * @example
 * ```typescript
 * import { lazy } from 'react';
 * import { registerWidget } from '@bahmni/widgets';
 *
 * // Register a new custom widget
 * registerWidget({
 *   type: 'customPatientSummary',
 *   component: lazy(() => import('./CustomPatientSummary')),
 * });
 *
 * // Override a built-in widget
 * registerWidget({
 *   type: 'allergies',
 *   component: lazy(() => import('./EnhancedAllergiesTable')),
 * });
 * ```
 */
export const registerWidget = (config: WidgetConfig): void => {
  WidgetRegistryManager.getInstance().register(config);
};

/**
 * Get a widget component by type
 *
 * @param type - Widget type identifier
 * @returns The lazy-loaded component or undefined if not found
 *
 * @example
 * ```typescript
 * import { getWidget } from '@bahmni/widgets';
 *
 * const AllergiesWidget = getWidget('allergies');
 * if (AllergiesWidget) {
 *   return <AllergiesWidget config={config} />;
 * }
 * ```
 */
export const getWidget = (
  type: string,
): LazyExoticComponent<ComponentType<any>> | undefined => {
  return WidgetRegistryManager.getInstance().get(type);
};

/**
 * Get full widget configuration by type
 *
 * @param type - Widget type identifier
 * @returns The widget configuration or undefined if not found
 */
export const getWidgetConfig = (type: string): WidgetConfig | undefined => {
  return WidgetRegistryManager.getInstance().getConfig(type);
};

/**
 * Check if a widget type is registered
 *
 * @param type - Widget type identifier
 * @returns true if the widget is registered, false otherwise
 *
 * @example
 * ```typescript
 * import { hasWidget } from '@bahmni/widgets';
 *
 * if (hasWidget('customWidget')) {
 *   console.log('Custom widget is available');
 * }
 * ```
 */
export const hasWidget = (type: string): boolean => {
  return WidgetRegistryManager.getInstance().has(type);
};

/**
 * Get all registered widget types
 *
 * @returns Array of widget type identifiers
 *
 * @example
 * ```typescript
 * import { getAllWidgetTypes } from '@bahmni/widgets';
 *
 * const availableWidgets = getAllWidgetTypes();
 * console.log('Available widgets:', availableWidgets);
 * ```
 */
export const getAllWidgetTypes = (): string[] => {
  return WidgetRegistryManager.getInstance().getAll();
};

/**
 * Get all registered widget configurations
 *
 * @returns Array of widget configurations
 */
export const getAllWidgetConfigs = (): WidgetConfig[] => {
  return WidgetRegistryManager.getInstance().getAllConfigs();
};

/**
 * Reset registry to initial state (useful for testing)
 * This clears all custom registrations and restores built-in widgets
 */
export const resetWidgetRegistry = (): void => {
  WidgetRegistryManager.getInstance().reset();
};
