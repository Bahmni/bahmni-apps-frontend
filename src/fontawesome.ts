import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

/**
 * Initialize FontAwesome library by adding all free solid and regular icons
 * This makes all icons available throughout the application
 */
export const initFontAwesome = () => {
  library.add(fas, far);
};
