import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

/**
 * Initialize FontAwesome library by adding all free solid icons
 * This makes all icons available throughout the application
 */
export const initFontAwesome = () => {
  library.add(fas);
};

export { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
