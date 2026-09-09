import { registerSearchWidget } from '../registry';
import CommonSearchWidget from './CommonSearchWidget';

registerSearchWidget({
  key: 'commonSearch',
  component: CommonSearchWidget,
});

export { default as CommonSearchWidget } from './CommonSearchWidget';
