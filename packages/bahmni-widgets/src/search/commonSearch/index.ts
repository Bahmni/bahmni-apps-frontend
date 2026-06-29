import { registerSearchWidget } from '../registry';
import AdvancedSearchWidget from './AdvancedSearchWidget';

registerSearchWidget({
  key: 'advancedSearch',
  component: AdvancedSearchWidget,
});

export { default } from './AdvancedSearchWidget';
