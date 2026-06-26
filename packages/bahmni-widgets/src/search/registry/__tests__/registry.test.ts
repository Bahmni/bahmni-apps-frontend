import {
  getExtensionWidget,
  clearExtensionWidget,
} from '../../../extensions/registry';
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
    it('stores the raw widget in the search registry', () => {
      registerSearchWidget({ key: 'testWidget', component: MockWidget });

      expect(getSearchWidget('testWidget')?.component).toBe(MockWidget);
    });

    it('stores a wrapped widget in the extension registry', () => {
      registerSearchWidget({ key: 'testWidget', component: MockWidget });

      const extensionWidget = getExtensionWidget('testWidget');
      expect(extensionWidget).toBeDefined();
      expect(extensionWidget?.component).not.toBe(MockWidget);
    });

    it('sets displayName on the wrapped extension widget', () => {
      registerSearchWidget({ key: 'testWidget', component: MockWidget });

      const extensionWidget = getExtensionWidget('testWidget');
      expect(extensionWidget?.component.displayName).toBe(
        'WithSearchConfig(MockWidget)',
      );
    });
  });

  describe('getSearchWidget', () => {
    it('returns undefined for an unregistered key', () => {
      expect(getSearchWidget('unknown')).toBeUndefined();
    });

    it('returns the correct raw widget for a registered key', () => {
      registerSearchWidget({ key: 'testWidget', component: MockWidget });

      expect(getSearchWidget('testWidget')?.component).toBe(MockWidget);
    });
  });

  describe('clearSearchWidgetRegistry', () => {
    it('removes entries from both the search and extension registries', () => {
      registerSearchWidget({ key: 'testWidget', component: MockWidget });

      clearSearchWidgetRegistry();

      expect(getSearchWidget('testWidget')).toBeUndefined();
      expect(getExtensionWidget('testWidget')).toBeUndefined();
    });
  });
});
