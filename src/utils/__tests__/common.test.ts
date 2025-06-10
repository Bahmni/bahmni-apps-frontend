import {
  capitalize,
  generateId,
  getFormattedError,
  getCookieByName,
  isStringEmpty,
  getPriorityByOrder,
} from '../common';
import axios, { AxiosError } from 'axios';
import i18n from '@/setupTests.i18n';

jest.mock('axios', () => ({
  isAxiosError: jest.fn(),
  get: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('common utility functions', () => {
  describe('getCookieByName', () => {
    const originalDocumentCookie = Object.getOwnPropertyDescriptor(
      document,
      'cookie',
    );

    beforeEach(() => {
      // Reset document.cookie before each test
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });
    });

    afterAll(() => {
      // Restore original document.cookie after tests
      if (originalDocumentCookie) {
        Object.defineProperty(document, 'cookie', originalDocumentCookie);
      }
    });

    it('should return cookie value when cookie exists', () => {
      // Arrange
      document.cookie = 'test_cookie=cookie_value';

      // Act
      const result = getCookieByName('test_cookie');

      // Assert
      expect(result).toBe('cookie_value');
    });

    it('should return empty string when cookie does not exist', () => {
      // Act
      const result = getCookieByName('nonexistent_cookie');

      // Assert
      expect(result).toBe('');
    });

    it('should handle URL-encoded cookie values', () => {
      // Arrange
      document.cookie = 'encoded_cookie=%7B%22key%22%3A%22value%22%7D';

      // Act
      const result = getCookieByName('encoded_cookie');

      // Assert
      expect(result).toBe('%7B%22key%22%3A%22value%22%7D');
    });

    it('should handle cookies with special characters in name', () => {
      // Arrange - Set a cookie with dots in name (common for namespaced cookies)
      document.cookie = 'bahmni.user.location=location_value';

      // Act
      const result = getCookieByName('bahmni.user.location');

      // Assert
      expect(result).toBe('location_value');
    });
  });
  describe('generateId', () => {
    it('should generate a random string ID', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('getFormattedError', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      i18n.changeLanguage('en');
    });

    it('should handle Axios errors with response - 401 Unauthorized', () => {
      const mockResponse = {
        status: 401,
        data: { message: 'Unauthorized' },
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Request failed',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Unauthorized',
        message:
          'You are not authorized to perform this action. Please log in again.',
      });
    });

    it('should handle Axios errors with response - 404 Not Found', () => {
      const mockResponse = {
        status: 404,
        data: { message: 'Resource not found' },
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Request failed',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Not Found',
        message: 'The requested resource was not found.',
      });
    });

    it('should handle 403 authorization errors', () => {
      const mockResponse = {
        status: 403,
        data: {},
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Forbidden',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Unauthorized',
        message:
          'You are not authorized to perform this action. Please log in again.',
      });
    });

    it('should handle server errors (500+)', () => {
      const mockResponse = {
        status: 500,
        data: {},
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Server Error',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
      });
    });

    it('should handle all non standard axios errors', () => {
      const mockResponse = {
        status: 600,
        data: {},
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'An unknown error occurred',
      });
    });

    it('should return Network Error message when axiosError.request exists', () => {
      // Mock an AxiosError with a request property (indicating a network issue)
      const axiosError = {
        isAxiosError: true,
        request: new Error('Network Error'), // Simulates a network error where no response is received
      } as unknown as AxiosError;

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Network Error',
        message:
          'Unable to connect to the server. Please check your internet connection.',
      });
    });

    it('should handle bad request (400) errors', () => {
      const mockResponse = {
        status: 400,
        data: { message: 'Invalid input parameters' },
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Bad Request',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Bad Request',
        message:
          'Invalid input parameters. Please check your request and try again.',
      });
    });

    it('should handle Axios error with undefined response data', () => {
      const mockResponse = {
        status: 422,
        data: undefined,
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Error processing your request',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'Error processing your request',
      });
    });

    it('should handle non-Axios error object that looks like an Axios error', () => {
      const nonAxiosError = {
        isAxiosError: false,
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
        message: 'Error message',
      };

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getFormattedError(nonAxiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'An unknown error occurred',
      });
    });

    it('should handle undefined error input', () => {
      const result = getFormattedError(undefined);
      expect(result).toEqual({
        title: 'Error',
        message: 'An unexpected error occurred',
      });
    });

    it('should handle Axios error with empty response data', () => {
      const mockResponse = {
        status: 422,
        data: {}, // Empty response data
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Error processing your request',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'Error processing your request',
      });
    });

    it('should handle Axios error with null response data', () => {
      const mockResponse = {
        status: 422,
        data: null,
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Error processing your request',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'Error processing your request',
      });
    });

    it('should handle custom error messages in response data', () => {
      const mockResponse = {
        status: 422,
        data: { message: 'Validation failed' },
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Unprocessable Entity',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'Validation failed',
      });
    });

    it('should handle Axios error with response but no data message', () => {
      const mockResponse = {
        status: 422,
        data: {}, // No message in response data
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Custom error message',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'Custom error message',
      });
    });

    it('should handle network errors (no response)', () => {
      const axiosError = {
        isAxiosError: true,
        response: undefined,
        request: {},
        message: 'Network Error',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Network Error',
        message:
          'Unable to connect to the server. Please check your internet connection.',
      });
    });

    it('should handle generic Error objects', () => {
      const error = new Error('Something went wrong');
      mockedAxios.get.mockRejectedValue(error);
      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Error',
        message: 'Something went wrong',
      });
    });

    it('should handle string errors', () => {
      const errorMessage = 'Simple error message';

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getFormattedError(errorMessage);

      expect(result).toEqual({
        title: 'Error',
        message: 'Simple error message',
      });
    });

    it('should handle unknown error types', () => {
      const unknownError = { foo: 'bar' };

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getFormattedError(unknownError);

      expect(result).toEqual({
        title: 'Error',
        message: 'An unknown error occurred',
      });
    });
  });

  describe('capitalize', () => {
    it('should convert string to capital case', () => {
      expect(capitalize('foo bar')).toBe('Foo Bar');
      expect(capitalize('foo-bar')).toBe('Foo Bar');
      expect(capitalize('FOO BAR')).toBe('Foo Bar');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single word', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle custom delimiters', () => {
      expect(capitalize('foo_bar-baz', '_-')).toBe('Foo Bar Baz');
    });
  });

  describe('isStringEmpty', () => {
    it('should return true for undefined input', () => {
      expect(isStringEmpty(undefined)).toBe(true);
    });

    it('should return true for null input', () => {
      // @ts-expect-error - Testing null case even though type is string | undefined
      expect(isStringEmpty(null)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isStringEmpty('')).toBe(true);
    });

    it('should return true for string with only whitespace', () => {
      expect(isStringEmpty('   ')).toBe(true);
      expect(isStringEmpty('\t\n')).toBe(true);
      expect(isStringEmpty(' \n \t ')).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(isStringEmpty('hello')).toBe(false);
      expect(isStringEmpty(' hello ')).toBe(false);
      expect(isStringEmpty('hello world')).toBe(false);
    });
  });

  describe('getPriorityByOrder', () => {
    const mockPriorityOrder = ['high', 'medium', 'low'];

    // Test valid values in priority array
    test.each([
      ['high', 0],
      ['medium', 1],
      ['low', 2],
    ])(
      'returns correct index %i for %s in priority array',
      (value, expected) => {
        expect(getPriorityByOrder(value, mockPriorityOrder)).toBe(expected);
      },
    );

    // Test case insensitive matching
    test.each([
      ['HIGH', 0],
      ['High', 0],
      ['HiGh', 0],
      ['MEDIUM', 1],
      ['Medium', 1],
      ['MeDiUm', 1],
      ['LOW', 2],
      ['Low', 2],
      ['LoW', 2],
    ])(
      'handles case insensitive matching: %s should return %i',
      (value, expected) => {
        expect(getPriorityByOrder(value, mockPriorityOrder)).toBe(expected);
      },
    );

    // Test values not in priority array
    test('returns 999 for values not in priority array', () => {
      expect(getPriorityByOrder('unknown', mockPriorityOrder)).toBe(999);
      expect(getPriorityByOrder('invalid', mockPriorityOrder)).toBe(999);
      expect(getPriorityByOrder('critical', mockPriorityOrder)).toBe(999);
    });

    // Test empty priority array
    test('returns 999 for empty priority array', () => {
      expect(getPriorityByOrder('high', [])).toBe(999);
      expect(getPriorityByOrder('any-value', [])).toBe(999);
    });

    // Test null/undefined values
    test('returns 999 for null/undefined value', () => {
      expect(getPriorityByOrder('', mockPriorityOrder)).toBe(999);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getPriorityByOrder(null as any, mockPriorityOrder)).toBe(999);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getPriorityByOrder(undefined as any, mockPriorityOrder)).toBe(999);
    });

    // Test null/undefined priority array
    test('returns 999 for null/undefined priority array', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getPriorityByOrder('high', null as any)).toBe(999);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getPriorityByOrder('high', undefined as any)).toBe(999);
    });

    // Test whitespace handling
    test('handles whitespace in values', () => {
      expect(getPriorityByOrder(' high ', mockPriorityOrder)).toBe(0);
      expect(getPriorityByOrder('  medium  ', mockPriorityOrder)).toBe(1);
      expect(getPriorityByOrder('\tlow\n', mockPriorityOrder)).toBe(2);
    });

    // Test order consistency
    test('maintains consistent ordering', () => {
      const customOrder = ['severe', 'moderate', 'mild', 'none'];

      expect(getPriorityByOrder('severe', customOrder)).toBe(0);
      expect(getPriorityByOrder('moderate', customOrder)).toBe(1);
      expect(getPriorityByOrder('mild', customOrder)).toBe(2);
      expect(getPriorityByOrder('none', customOrder)).toBe(3);
    });

    // Test single item array
    test('works with single item priority array', () => {
      const singleItem = ['only'];
      expect(getPriorityByOrder('only', singleItem)).toBe(0);
      expect(getPriorityByOrder('other', singleItem)).toBe(999);
    });

    // Test duplicate values in priority array (should return first match)
    test('returns first match for duplicate values in priority array', () => {
      const duplicateOrder = ['high', 'medium', 'high', 'low'];
      expect(getPriorityByOrder('high', duplicateOrder)).toBe(0);
      expect(getPriorityByOrder('medium', duplicateOrder)).toBe(1);
      expect(getPriorityByOrder('low', duplicateOrder)).toBe(3);
    });
  });
});
