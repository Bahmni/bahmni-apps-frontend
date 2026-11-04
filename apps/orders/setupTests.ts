import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
// Import and initialize i18n for tests
import './setupTests.i18n';

global.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
global.TextDecoder = TextDecoder;
