import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { initFontAwesome } from '@bahmni/design-system';
import './setupTests.i18n';

initFontAwesome();

global.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
global.TextDecoder = TextDecoder;

if (!global.crypto?.randomUUID) {
  let counter = 0;
  const randomUUID = () => {
    counter += 1;
    return `00000000-0000-0000-0000-${String(counter).padStart(12, '0')}`;
  };
  if (!global.crypto) {
    Object.defineProperty(global, 'crypto', {
      value: {},
      writable: true,
      configurable: true,
    });
  }
  Object.defineProperty(global.crypto, 'randomUUID', {
    value: randomUUID,
    writable: true,
    configurable: true,
  });
}
