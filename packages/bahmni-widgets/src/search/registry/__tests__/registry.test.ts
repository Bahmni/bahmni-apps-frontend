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

    it('stores the raw component without wrapping', () => {
      registerSearchWidget({ key: 'testWidget', component: MockWidget });
      expect(getSearchWidget('testWidget')?.component).toBe(MockWidget);
    });

    it('registers multiple widgets independently', () => {
      const MockWidgetB = () => null;
      MockWidgetB.displayName = 'MockWidgetB';
      registerSearchWidget({ key: 'widgetA', component: MockWidget });
      registerSearchWidget({ key: 'widgetB', component: MockWidgetB });
      expect(getSearchWidget('widgetA')?.component).toBe(MockWidget);
      expect(getSearchWidget('widgetB')?.component).toBe(MockWidgetB);
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
