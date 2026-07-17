import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';
import { initFontAwesome } from '@bahmni/design-system';
import { toHaveNoViolations } from 'jest-axe';
import './setupTests.i18n';

expect.extend(toHaveNoViolations);

initFontAwesome();

// @ts-expect-error - Ignoring type issues with Node.js util TextEncoder
globalThis.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
globalThis.TextDecoder = TextDecoder;
