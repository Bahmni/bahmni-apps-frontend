import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';
import { initFontAwesome } from '@bahmni/design-system';
// Import and initialize i18n for tests
import './setupTests.i18n';

// Initialize FontAwesome icons for tests
initFontAwesome();

// @ts-expect-error - Ignoring type issues with Node.js util TextEncoder
globalThis.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
globalThis.TextDecoder = TextDecoder;

globalThis.HTMLElement.prototype.scrollIntoView = jest.fn();

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Polyfill crypto.randomUUID for jest/jsdom environment
if (!globalThis.crypto?.randomUUID) {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => {
        counter += 1;
        return `00000000-0000-0000-0000-${String(counter).padStart(12, '0')}`;
      },
    },
    writable: true,
  });
}
