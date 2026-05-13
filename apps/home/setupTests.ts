import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { initFontAwesome } from '@bahmni/design-system';
import './setupTests.i18n';

initFontAwesome();

// @ts-expect-error - Ignoring type issues with Node.js util TextEncoder
global.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
global.TextDecoder = TextDecoder;

if (!global.crypto?.randomUUID) {
  let counter = 0;
  Object.defineProperty(global, 'crypto', {
    value: {
      ...global.crypto,
      randomUUID: () => {
        counter += 1;
        return `00000000-0000-0000-0000-${String(counter).padStart(12, '0')}`;
      },
    },
    writable: true,
  });
}
