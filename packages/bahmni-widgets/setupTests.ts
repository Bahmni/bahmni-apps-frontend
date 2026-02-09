import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import './setupTests.i18n';

global.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
global.TextDecoder = TextDecoder;
