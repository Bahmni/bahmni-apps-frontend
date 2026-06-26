import {
  clearExtensionWidget,
  getExtensionWidget,
  registerExtensionWidget,
} from '../registry';

const MockWidgetA = () => null;
const MockWidgetB = () => null;

describe('Extension Widget Registry', () => {
  beforeEach(() => {
    clearExtensionWidget();
  });

  describe('registerExtensionWidget', () => {
    it('registers a widget and makes it retrievable by key', () => {
      registerExtensionWidget({ key: 'widgetA', component: MockWidgetA });

      expect(getExtensionWidget('widgetA')).toEqual({
        key: 'widgetA',
        component: MockWidgetA,
      });
    });

    it('registers multiple widgets independently', () => {
      registerExtensionWidget({ key: 'widgetA', component: MockWidgetA });
      registerExtensionWidget({ key: 'widgetB', component: MockWidgetB });

      expect(getExtensionWidget('widgetA')?.component).toBe(MockWidgetA);
      expect(getExtensionWidget('widgetB')?.component).toBe(MockWidgetB);
    });
  });

  describe('getExtensionWidget', () => {
    it('returns undefined for an unregistered key', () => {
      expect(getExtensionWidget('unknownKey')).toBeUndefined();
    });

    it('returns the correct widget when multiple widgets are registered', () => {
      registerExtensionWidget({ key: 'widgetA', component: MockWidgetA });
      registerExtensionWidget({ key: 'widgetB', component: MockWidgetB });

      expect(getExtensionWidget('widgetB')?.component).toBe(MockWidgetB);
    });
  });

  describe('clearExtensionWidget', () => {
    it('removes all registered widgets', () => {
      registerExtensionWidget({ key: 'widgetA', component: MockWidgetA });
      registerExtensionWidget({ key: 'widgetB', component: MockWidgetB });

      clearExtensionWidget();

      expect(getExtensionWidget('widgetA')).toBeUndefined();
      expect(getExtensionWidget('widgetB')).toBeUndefined();
    });
  });
});
