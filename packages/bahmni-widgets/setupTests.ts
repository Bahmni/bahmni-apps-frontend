import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';
import { initFontAwesome } from '@bahmni/design-system';
import './setupTests.i18n';

// Initialize FontAwesome icons for tests
initFontAwesome();

// @ts-expect-error - Ignoring type issues with Node.js util TextEncoder
globalThis.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
globalThis.TextDecoder = TextDecoder;

Element.prototype.scrollIntoView = jest.fn();

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
