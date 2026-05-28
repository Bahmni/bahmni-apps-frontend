import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';
import { initFontAwesome } from '@bahmni/design-system';
import './setupTests.i18n';

initFontAwesome();

globalThis.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
globalThis.TextDecoder = TextDecoder;

if (!globalThis.crypto?.randomUUID) {
  let counter = 0;
  const randomUUID = () => {
    counter += 1;
    return `00000000-0000-0000-0000-${String(counter).padStart(12, '0')}`;
  };
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      writable: true,
      configurable: true,
    });
  }
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: randomUUID,
    writable: true,
    configurable: true,
  });
}
