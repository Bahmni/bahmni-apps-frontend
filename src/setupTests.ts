import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
// @ts-ignore - Ignoring type issues with Node.js util TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
// @ts-ignore - Ignoring type issues with Node.js util TextEncoder/TextDecoder
global.TextDecoder = TextDecoder;
