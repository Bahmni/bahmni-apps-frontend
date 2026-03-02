import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// @ts-expect-error - Ignoring type issues with Node.js util TextEncoder
global.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
global.TextDecoder = TextDecoder;
