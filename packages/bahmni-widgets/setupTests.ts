import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { initFontAwesome } from '@bahmni/design-system';
import './setupTests.i18n';

// Initialize FontAwesome icons for tests
initFontAwesome();

// @ts-expect-error - Ignoring type issues with Node.js util TextEncoder
global.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
global.TextDecoder = TextDecoder;
