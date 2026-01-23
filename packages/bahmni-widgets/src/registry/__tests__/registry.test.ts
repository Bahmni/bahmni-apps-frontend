import { lazy } from 'react';
import {
  registerWidget,
  getWidget,
  getWidgetConfig,
  hasWidget,
  getAllWidgetTypes,
  getAllWidgetConfigs,
  resetWidgetRegistry,
} from '../index';

import { WidgetConfig } from '../model';

// Mock React components for testing
const MockComponent1 = () => null;
const MockComponent2 = () => null;
const MockComponent3 = () => null;

describe('Widget Registry', () => {
  // Reset registry before each test to ensure clean state
  beforeEach(() => {
    resetWidgetRegistry();
  });

  describe('Built-in Widgets', () => {
    test('should pre-register all built-in widgets', () => {
      const builtInWidgets = [
        'allergies',
        'conditions',
        'diagnoses',
        'labOrders',
        'pacsOrders',
        'treatment',
        'flowSheet',
      ];

      builtInWidgets.forEach((widgetType) => {
        expect(hasWidget(widgetType)).toBe(true);
      });
    });

    test('should return components for built-in widgets', () => {
      const allergiesWidget = getWidget('allergies');
      expect(allergiesWidget).toBeDefined();
      expect(typeof allergiesWidget).toBe('object');
    });

    test('should return config for built-in widgets', () => {
      const allergiesConfig = getWidgetConfig('allergies');
      expect(allergiesConfig).toBeDefined();
      expect(allergiesConfig?.type).toBe('allergies');
      expect(allergiesConfig?.component).toBeDefined();
    });
  });

  describe('registerWidget', () => {
    test('should register a new custom widget', () => {
      const customWidget: WidgetConfig = {
        type: 'customWidget',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      registerWidget(customWidget);

      expect(hasWidget('customWidget')).toBe(true);
      expect(getWidget('customWidget')).toBeDefined();
    });

    test('should register widget with minimal config', () => {
      const minimalWidget: WidgetConfig = {
        type: 'minimalWidget',
        component: lazy(() => Promise.resolve({ default: MockComponent2 })),
      };

      registerWidget(minimalWidget);

      expect(hasWidget('minimalWidget')).toBe(true);
      const config = getWidgetConfig('minimalWidget');
      expect(config?.type).toBe('minimalWidget');
      expect(config?.component).toBeDefined();
    });

    test('should override existing widget when registering with same type', () => {
      const originalWidget: WidgetConfig = {
        type: 'testWidget',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      const overrideWidget: WidgetConfig = {
        type: 'testWidget',
        component: lazy(() => Promise.resolve({ default: MockComponent2 })),
      };

      registerWidget(originalWidget);
      const originalComponent = getWidget('testWidget');

      registerWidget(overrideWidget);
      const overrideComponent = getWidget('testWidget');

      expect(overrideComponent).not.toBe(originalComponent);
      expect(overrideComponent).toBe(overrideWidget.component);
    });

    test('should allow overriding built-in widgets', () => {
      const customAllergies: WidgetConfig = {
        type: 'allergies',
        component: lazy(() => Promise.resolve({ default: MockComponent3 })),
      };

      const originalComponent = getWidget('allergies');
      registerWidget(customAllergies);
      const overriddenComponent = getWidget('allergies');

      expect(overriddenComponent).not.toBe(originalComponent);
      expect(overriddenComponent).toBe(customAllergies.component);
    });

    test('should throw error for invalid widget type', () => {
      const invalidWidget = {
        type: '',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      } as WidgetConfig;

      expect(() => registerWidget(invalidWidget)).toThrow(
        'Widget type must be a non-empty string',
      );
    });

    test('should throw error for non-string widget type', () => {
      const invalidWidget = {
        type: 123,
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      } as unknown as WidgetConfig;

      expect(() => registerWidget(invalidWidget)).toThrow(
        'Widget type must be a non-empty string',
      );
    });

    test('should throw error for missing component', () => {
      const invalidWidget = {
        type: 'testWidget',
      } as WidgetConfig;

      expect(() => registerWidget(invalidWidget)).toThrow(
        'Widget component is required',
      );
    });

    test('should register multiple widgets', () => {
      const widgets: WidgetConfig[] = [
        {
          type: 'widget1',
          component: lazy(() => Promise.resolve({ default: MockComponent1 })),
        },
        {
          type: 'widget2',
          component: lazy(() => Promise.resolve({ default: MockComponent2 })),
        },
        {
          type: 'widget3',
          component: lazy(() => Promise.resolve({ default: MockComponent3 })),
        },
      ];

      widgets.forEach((widget) => registerWidget(widget));

      expect(hasWidget('widget1')).toBe(true);
      expect(hasWidget('widget2')).toBe(true);
      expect(hasWidget('widget3')).toBe(true);
    });
  });

  describe('getWidget', () => {
    test('should return widget component for registered type', () => {
      const widget = getWidget('allergies');
      expect(widget).toBeDefined();
    });

    test('should return undefined for unregistered type', () => {
      const widget = getWidget('nonExistentWidget');
      expect(widget).toBeUndefined();
    });

    test('should return undefined for empty string', () => {
      const widget = getWidget('');
      expect(widget).toBeUndefined();
    });

    test('should return correct component after override', () => {
      const customWidget: WidgetConfig = {
        type: 'testWidget',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      registerWidget(customWidget);
      const widget = getWidget('testWidget');
      expect(widget).toBe(customWidget.component);
    });
  });

  describe('getWidgetConfig', () => {
    test('should return full config for registered widget', () => {
      const customWidget: WidgetConfig = {
        type: 'customWidget',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      registerWidget(customWidget);
      const config = getWidgetConfig('customWidget');

      expect(config).toBeDefined();
      expect(config?.type).toBe('customWidget');
      expect(config?.component).toBe(customWidget.component);
    });

    test('should return undefined for unregistered widget', () => {
      const config = getWidgetConfig('nonExistentWidget');
      expect(config).toBeUndefined();
    });
  });

  describe('hasWidget', () => {
    test('should return true for registered widget', () => {
      expect(hasWidget('allergies')).toBe(true);
    });

    test('should return false for unregistered widget', () => {
      expect(hasWidget('nonExistentWidget')).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(hasWidget('')).toBe(false);
    });

    test('should return true after registering custom widget', () => {
      const customWidget: WidgetConfig = {
        type: 'customWidget',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      expect(hasWidget('customWidget')).toBe(false);
      registerWidget(customWidget);
      expect(hasWidget('customWidget')).toBe(true);
    });

    test('should be case sensitive', () => {
      expect(hasWidget('allergies')).toBe(true);
      expect(hasWidget('Allergies')).toBe(false);
      expect(hasWidget('ALLERGIES')).toBe(false);
    });
  });

  describe('getAllWidgetTypes', () => {
    test('should return all built-in widget types', () => {
      const types = getAllWidgetTypes();
      const expectedTypes = [
        'allergies',
        'conditions',
        'diagnoses',
        'labOrders',
        'pacsOrders',
        'treatment',
        'flowSheet',
        'ordersControl',
        'programs',
        'observations',
        'forms',
      ];

      expect(types).toHaveLength(expectedTypes.length);
      expectedTypes.forEach((type) => {
        expect(types).toContain(type);
      });
    });

    test('should include custom widgets in the list', () => {
      const customWidget: WidgetConfig = {
        type: 'customWidget',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      registerWidget(customWidget);
      const types = getAllWidgetTypes();

      expect(types).toContain('customWidget');
      expect(types.length).toBeGreaterThan(7); // 7 built-in + 1 custom
    });

    test('should not include duplicates after override', () => {
      const customAllergies: WidgetConfig = {
        type: 'allergies',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      const initialCount = getAllWidgetTypes().length;
      registerWidget(customAllergies);
      const finalCount = getAllWidgetTypes().length;

      expect(finalCount).toBe(initialCount);
    });
  });

  describe('getAllWidgetConfigs', () => {
    test('should return all widget configurations', () => {
      const configs = getAllWidgetConfigs();
      expect(configs.length).toBeGreaterThan(0);

      configs.forEach((config) => {
        expect(config).toHaveProperty('type');
        expect(config).toHaveProperty('component');
      });
    });

    test('should include custom widget configs', () => {
      const customWidget: WidgetConfig = {
        type: 'customWidget',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      registerWidget(customWidget);
      const configs = getAllWidgetConfigs();

      const customConfig = configs.find((c) => c.type === 'customWidget');
      expect(customConfig).toBeDefined();
      expect(customConfig?.component).toBe(customWidget.component);
    });

    test('should reflect overrides in configs', () => {
      const customAllergies: WidgetConfig = {
        type: 'allergies',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      registerWidget(customAllergies);
      const configs = getAllWidgetConfigs();

      const allergiesConfig = configs.find((c) => c.type === 'allergies');
      expect(allergiesConfig?.component).toBe(customAllergies.component);
    });
  });

  describe('resetWidgetRegistry', () => {
    test('should clear custom widgets and restore built-in widgets', () => {
      const customWidget: WidgetConfig = {
        type: 'customWidget',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      registerWidget(customWidget);
      expect(hasWidget('customWidget')).toBe(true);

      resetWidgetRegistry();
      expect(hasWidget('customWidget')).toBe(false);
      expect(hasWidget('allergies')).toBe(true); // Built-in should still exist
    });

    test('should restore overridden built-in widgets', () => {
      const customAllergies: WidgetConfig = {
        type: 'allergies',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      // Verify allergies exists initially
      expect(hasWidget('allergies')).toBe(true);

      registerWidget(customAllergies);
      const overriddenComponent = getWidget('allergies');
      expect(overriddenComponent).toBe(customAllergies.component);

      resetWidgetRegistry();
      const restoredComponent = getWidget('allergies');

      // After reset, allergies should still exist but not be the custom one
      expect(hasWidget('allergies')).toBe(true);
      expect(restoredComponent).toBeDefined();
      expect(restoredComponent).not.toBe(customAllergies.component);
    });

    test('should maintain correct count after reset', () => {
      const customWidgets: WidgetConfig[] = [
        {
          type: 'widget1',
          component: lazy(() => Promise.resolve({ default: MockComponent1 })),
        },
        {
          type: 'widget2',
          component: lazy(() => Promise.resolve({ default: MockComponent2 })),
        },
      ];

      customWidgets.forEach((widget) => registerWidget(widget));
      const countWithCustom = getAllWidgetTypes().length;

      resetWidgetRegistry();
      const countAfterReset = getAllWidgetTypes().length;

      expect(countAfterReset).toBe(11); // Only built-in widgets
      expect(countWithCustom).toBeGreaterThan(countAfterReset);
    });
  });

  describe('Singleton Pattern', () => {
    test('should maintain state across multiple function calls', () => {
      const widget1: WidgetConfig = {
        type: 'widget1',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      const widget2: WidgetConfig = {
        type: 'widget2',
        component: lazy(() => Promise.resolve({ default: MockComponent2 })),
      };

      registerWidget(widget1);
      expect(hasWidget('widget1')).toBe(true);

      registerWidget(widget2);
      expect(hasWidget('widget1')).toBe(true);
      expect(hasWidget('widget2')).toBe(true);
    });

    test('should share state between different API functions', () => {
      const customWidget: WidgetConfig = {
        type: 'sharedWidget',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      registerWidget(customWidget);

      expect(hasWidget('sharedWidget')).toBe(true);
      expect(getWidget('sharedWidget')).toBeDefined();
      expect(getAllWidgetTypes()).toContain('sharedWidget');
      expect(getWidgetConfig('sharedWidget')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in widget type', () => {
      const specialWidget: WidgetConfig = {
        type: 'widget-with-dashes',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      registerWidget(specialWidget);
      expect(hasWidget('widget-with-dashes')).toBe(true);
    });

    test('should handle widget type with numbers', () => {
      const numericWidget: WidgetConfig = {
        type: 'widget123',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      registerWidget(numericWidget);
      expect(hasWidget('widget123')).toBe(true);
    });

    test('should handle widget type with underscores', () => {
      const underscoreWidget: WidgetConfig = {
        type: 'widget_with_underscores',
        component: lazy(() => Promise.resolve({ default: MockComponent1 })),
      };

      registerWidget(underscoreWidget);
      expect(hasWidget('widget_with_underscores')).toBe(true);
    });
  });
});
