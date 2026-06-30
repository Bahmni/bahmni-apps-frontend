import {
  clearSearchWidgetRegistry,
  getSearchWidget,
  registerSearchWidget,
} from '../registry';

const MockWidget = () => null;
MockWidget.displayName = 'MockWidget';

describe('Search Widget Registry', () => {
  beforeEach(() => {
    clearSearchWidgetRegistry();
  });

  describe('registerSearchWidget', () => {
    it('stores the widget and makes it retrievable by key', () => {
      registerSearchWidget({ key: 'testWidget', component: MockWidget });
      expect(getSearchWidget('testWidget')).toBeDefined();
    });

    it('wraps component with withSearchConfig on registration', () => {
      registerSearchWidget({ key: 'testWidget', component: MockWidget });
      const registered = getSearchWidget('testWidget');
      expect(registered?.component.displayName).toBe(
        'WithSearchConfig(MockWidget)',
      );
    });

    it('registers multiple widgets independently', () => {
      const MockWidgetB = () => null;
      MockWidgetB.displayName = 'MockWidgetB';
      registerSearchWidget({ key: 'widgetA', component: MockWidget });
      registerSearchWidget({ key: 'widgetB', component: MockWidgetB });
      expect(getSearchWidget('widgetA')?.component.displayName).toBe(
        'WithSearchConfig(MockWidget)',
      );
      expect(getSearchWidget('widgetB')?.component.displayName).toBe(
        'WithSearchConfig(MockWidgetB)',
      );
    });
  });

  describe('getSearchWidget', () => {
    it('returns undefined for an unregistered key', () => {
      expect(getSearchWidget('unknown')).toBeUndefined();
    });
  });

  describe('clearSearchWidgetRegistry', () => {
    it('removes all registered widgets', () => {
      registerSearchWidget({ key: 'testWidget', component: MockWidget });
      clearSearchWidgetRegistry();
      expect(getSearchWidget('testWidget')).toBeUndefined();
    });
  });
});
